import { createHash } from "crypto"
import { readFileSync } from "fs"
import * as path from "path"
import { DnsValidatedCertificate, ICertificate } from "aws-cdk-lib/aws-certificatemanager"
import {
  AllowedMethods,
  type BehaviorOptions,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
  CachedMethods,
  Distribution,
  type ICachePolicy,
  type IOrigin,
  ViewerProtocolPolicy,
  FunctionEventType,
  OriginRequestPolicy,
  Function as CloudfrontFunction,
  FunctionCode,
} from "aws-cdk-lib/aws-cloudfront"
import { HttpOrigin, S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins"
import { TableV2 as Table, AttributeType, Billing } from "aws-cdk-lib/aws-dynamodb"
import { Rule, Schedule } from "aws-cdk-lib/aws-events"
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets"
import { type IGrantable } from "aws-cdk-lib/aws-iam"
import {
  Code,
  Function as CdkFunction,
  type FunctionOptions,
  FunctionUrlAuthType,
  InvokeMode,
  LoggingFormat,
  Runtime,
  Architecture,
} from "aws-cdk-lib/aws-lambda"
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources"
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs"
import { AaaaRecord, ARecord, IHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53"
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"
import { Queue } from "aws-cdk-lib/aws-sqs"
import {
  Annotations,
  CustomResource,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
} from "aws-cdk-lib/core"
import { Provider } from "aws-cdk-lib/custom-resources"
import { Construct } from "constructs"

type BaseFunction = {
  handler: string
  bundle: string
}

type OpenNextFunctionOrigin = {
  type: "function"
  streaming?: boolean
} & BaseFunction

type OpenNextS3Origin = {
  type: "s3"
  originPath: string
  copy: {
    from: string
    to: string
    cached: boolean
    versionedSubDir?: string
  }[]
}

type OpenNextOrigins = OpenNextFunctionOrigin | OpenNextS3Origin

interface OpenNextOutput {
  edgeFunctions: {
    [key: string]: BaseFunction
  }
  origins: {
    s3: OpenNextS3Origin
    default: OpenNextFunctionOrigin
    imageOptimizer: OpenNextFunctionOrigin
    [key: string]: OpenNextOrigins
  }
  behaviors: {
    pattern: string
    origin?: string
    edgeFunction?: string
  }[]
  additionalProps?: {
    disableIncrementalCache?: boolean
    disableTagCache?: boolean
    initializationFunction?: BaseFunction
    warmer?: BaseFunction
    revalidationFunction?: BaseFunction
  }
}

/**
 * Props for Lambda functions, excluding handler and code which are set by the construct.
 * Extends FunctionOptions and adds runtime.
 */
export interface DefaultFunctionProps extends FunctionOptions {
  /**
   * The runtime environment for the Lambda function.
   *
   * @default Runtime.NODEJS_24_X
   */
  readonly runtime?: Runtime
}

export interface DistributionDomainProps {
  /**
   * The domain to be assigned to the website URL (ie. domain.com).
   *
   * Supports domains that are hosted either on [Route 53](https://aws.amazon.com/route53/) or externally.
   */
  readonly domainName: string

  /**
   * Import the underlying Route 53 hosted zone.
   *
   * Required if `certificate` is not provided. When provided, a DNS-validated
   * certificate will be created automatically and DNS aliases will be set up.
   */
  readonly hostedZone?: IHostedZone

  /**
   * The ACM certificate to use for the custom domain.
   *
   * Required if `hostedZone` is not provided. The certificate must be in
   * us-east-1 for CloudFront distributions.
   *
   * When provided without `hostedZone`, no DNS aliases will be created
   * and you must configure DNS records externally.
   */
  readonly certificate?: ICertificate
}

export interface NextjsSiteProps {
  /**
   * The customDomain for this website. This domain must be hosted in
   * route53, and we must be able to create an ACM certificate for this
   * domain.
   *
   * Note that you can also migrate externally hosted domains to Route 53 by
   * [following this guide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html).
   */
  readonly customDomain?: DistributionDomainProps

  /**
   * Should point to the .open-next directory.
   *
   * @default ".open-next"
   */
  readonly openNextPath?: string | undefined

  /**
   * Default props to apply to all Lambda functions created by this construct.
   * These can be overridden by specific function configurations.
   */
  readonly defaultFunctionProps?: DefaultFunctionProps

  /**
   * The number of server instances to keep warm. Set to false to disable warming.
   * Must be a positive integer (>= 1) if specified. Values <= 0 will disable warming.
   *
   * @default 1
   * @example
   * warm: 5 // Keep 5 concurrent instances warm
   * warm: false // Disable warming
   */
  readonly warm?: number | false

  /**
   * How often to invoke the warmer function.
   *
   * @default Duration.minutes(5)
   * @example
   * warmerInterval: Duration.minutes(10)
   */
  readonly warmerInterval?: Duration

  /**
   * Whether to invoke the warmer function immediately after deployment.
   *
   * @default true
   * @example
   * prewarmOnDeploy: false
   */
  readonly prewarmOnDeploy?: boolean
}

export class NextjsSite extends Construct {
  private openNextOutput: OpenNextOutput
  private bucket: Bucket
  private table: Table
  private queue: Queue

  private staticCachePolicy: ICachePolicy
  private serverCachePolicy: CachePolicy

  private openNextPath: string

  public readonly distribution: Distribution
  private _defaultServerFunction!: CdkFunction
  private _customDomainName?: string
  private warmerFunction?: CdkFunction
  private props: NextjsSiteProps

  public get defaultServerFunction(): CdkFunction {
    return this._defaultServerFunction
  }

  public get url(): string {
    return `https://${this.distribution.distributionDomainName}`
  }

  public get customDomainUrl(): string {
    return this._customDomainName
      ? `https://${this._customDomainName}`
      : `https://${this.distribution.distributionDomainName}`
  }

  constructor(scope: Construct, id: string, props: NextjsSiteProps) {
    super(scope, id)
    this.props = props
    this.openNextPath = props.openNextPath ?? ".open-next"
    this.openNextOutput = JSON.parse(
      readFileSync(path.join(this.openNextPath, "open-next.output.json"), "utf-8")
    ) as OpenNextOutput

    this._customDomainName = props.customDomain?.domainName

    // Validate customDomain props: either certificate or hostedZone must be provided
    if (
      props.customDomain &&
      !props.customDomain.certificate &&
      !props.customDomain.hostedZone
    ) {
      throw new Error(
        "customDomain requires either a certificate or a hostedZone. " +
          "Provide a hostedZone to automatically create a DNS-validated certificate, " +
          "or provide your own certificate."
      )
    }

    this.bucket = new Bucket(this, "S3Bucket", {
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
    })
    this.table = this.createRevalidationTable()
    this.queue = this.createRevalidationQueue()

    // Use provided certificate or create one if hostedZone is available
    const certificate =
      props.customDomain?.certificate ??
      (props.customDomain?.hostedZone
        ? this.createCertificate(
            props.customDomain.domainName,
            props.customDomain.hostedZone
          )
        : undefined)

    const origins = this.createOrigins(props.defaultFunctionProps)
    this.serverCachePolicy = this.createServerCachePolicy()
    this.staticCachePolicy = this.createStaticCachePolicy()
    this.distribution = this.createDistribution(origins, props, certificate)
    this.createWarmer()
    if (props.customDomain && props.customDomain.hostedZone) {
      new ARecord(this, "AliasRecord", {
        zone: props.customDomain.hostedZone,
        recordName: props.customDomain.domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      })

      new AaaaRecord(this, "AliasRecordAAAA", {
        zone: props.customDomain.hostedZone,
        recordName: props.customDomain.domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      })
    }
  }

  private createCertificate(domainName: string, hostedZone: IHostedZone) {
    // CloudFront requires certificates to be in us-east-1
    // DnsValidatedCertificate handles cross-region certificate creation automatically
    return new DnsValidatedCertificate(this, "Certificate", {
      domainName,
      hostedZone,
      region: "us-east-1",
    })
  }

  private createRevalidationTable() {
    const table = new Table(this, "RevalidationTable", {
      partitionKey: { name: "tag", type: AttributeType.STRING },
      sortKey: { name: "path", type: AttributeType.STRING },
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      billing: Billing.onDemand(),
      globalSecondaryIndexes: [
        {
          indexName: "revalidate",
          partitionKey: { name: "path", type: AttributeType.STRING },
          sortKey: { name: "revalidatedAt", type: AttributeType.NUMBER },
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const initFn = this.openNextOutput.additionalProps?.initializationFunction

    const insertFn = new CdkFunction(this, "RevalidationInsertFunction", {
      description: "Next.js revalidation data insert",
      handler: initFn?.handler ?? "index.handler",
      // code: Code.fromAsset(initFn?.bundle ?? ""),
      code: Code.fromAsset(path.join(this.openNextPath, "dynamodb-provider")),
      runtime: Runtime.NODEJS_24_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(15),
      memorySize: 128,
      loggingFormat: LoggingFormat.JSON,
      environment: {
        CACHE_DYNAMO_TABLE: table.tableName,
      },
    })

    const providerLogGroup = new LogGroup(this, "RevalidationProviderLogGroup", {
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const provider = new Provider(this, "RevalidationProvider", {
      onEventHandler: insertFn,
      logGroup: providerLogGroup,
    })

    new CustomResource(this, "RevalidationResource", {
      serviceToken: provider.serviceToken,
      properties: {
        version: Date.now().toString(),
      },
    })

    return table
  }

  private createOrigins(defaultFunctionProps?: DefaultFunctionProps) {
    const {
      s3: s3Origin,
      default: defaultOrigin,
      imageOptimizer: imageOrigin,
      ...restOrigins
    } = this.openNextOutput.origins
    for (const copy of s3Origin.copy) {
      new BucketDeployment(this, `OpenNextBucketDeployment${copy.from}`, {
        sources: [Source.asset(path.join(this.openNextPath, "..", copy.from))],
        destinationBucket: this.bucket,
        destinationKeyPrefix: copy.to,
        prune: false,
      })
    }
    const origins = {
      s3: S3BucketOrigin.withOriginAccessControl(this.bucket, {
        originId: "S3Bucket",
        originPath: s3Origin.originPath,
      }),
      default: this.createFunctionOrigin(
        "default",
        defaultOrigin,
        "NextJsServer",
        defaultFunctionProps
      ),
      imageOptimizer: this.createFunctionOrigin(
        "imageOptimizer",
        imageOrigin,
        "ImageOptimizer"
      ),
      ...Object.entries(restOrigins).reduce(
        (acc, [key, value]) => {
          const originId = key.charAt(0).toUpperCase() + key.slice(1)
          if (value.type === "function") {
            acc[key] = this.createFunctionOrigin(key, value, originId)
          }
          return acc
        },
        {} as Record<string, HttpOrigin>
      ),
    }
    return origins
  }

  private createRevalidationQueue() {
    const queue = new Queue(this, "RevalidationQueue", {
      fifo: true,
      receiveMessageWaitTime: Duration.seconds(20),
    })
    const consumer = new CdkFunction(this, "RevalidationFunction", {
      description: "Next.js revalidator",
      handler: "index.handler",
      code: Code.fromAsset(
        this.openNextOutput.additionalProps?.revalidationFunction?.bundle
          ? path.join(
              this.openNextPath,
              "..",
              this.openNextOutput.additionalProps?.revalidationFunction?.bundle
            )
          : ""
      ),
      runtime: Runtime.NODEJS_24_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(30),
      loggingFormat: LoggingFormat.JSON,
    })
    consumer.addEventSource(new SqsEventSource(queue, { batchSize: 5 }))
    return queue
  }

  private createWarmer() {
    // Default: warm: 1, users can disable with warm: false
    const warmConcurrency = this.props.warm === false ? undefined : (this.props.warm ?? 1)

    // Skip if warming is disabled or invalid
    if (!warmConcurrency || warmConcurrency <= 0) return

    // Get warmer bundle from OpenNext
    const warmer = this.openNextOutput.additionalProps?.warmer
    if (!warmer) {
      Annotations.of(this).addWarning(
        "Warming is enabled but OpenNext did not provide a warmer bundle. " +
          "Skipping warmer creation. Ensure you're using OpenNext 3.x+ with warming support."
      )
      return
    }

    const warmerBundle = path.join(this.openNextPath, "..", warmer.bundle)
    const warmerHandler = warmer.handler

    // Configure WARM_PARAMS
    const warmParams = [
      {
        concurrency: warmConcurrency,
        function: this._defaultServerFunction.functionName,
      },
    ]

    // Create warmer Lambda
    this.warmerFunction = new CdkFunction(this, "WarmerFunction", {
      description: "Next.js warmer",
      handler: warmerHandler,
      code: Code.fromAsset(warmerBundle),
      runtime: Runtime.NODEJS_24_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(1),
      memorySize: 128,
      loggingFormat: LoggingFormat.JSON,
      environment: {
        WARM_PARAMS: JSON.stringify(warmParams),
      },
    })

    // Grant invoke permissions
    this._defaultServerFunction.grantInvoke(this.warmerFunction)
    this._defaultServerFunction.addEnvironment("WARMER_ENABLED", "true")

    // Create EventBridge rule
    const interval = this.props.warmerInterval ?? Duration.minutes(5)
    new Rule(this, "WarmerRule", {
      description: `Invoke warmer every ${interval.toMinutes()} minutes`,
      schedule: Schedule.rate(interval),
      targets: [new LambdaFunction(this.warmerFunction, { retryAttempts: 0 })],
    })

    // Create pre-warmer if enabled (default: true)
    if (this.props.prewarmOnDeploy !== false) {
      const prewarmerLogGroup = new LogGroup(this, "PrewarmerLogGroup", {
        retention: RetentionDays.ONE_DAY,
        removalPolicy: RemovalPolicy.DESTROY,
      })

      const prewarmerFn = new CdkFunction(this, "PrewarmerFunction", {
        description: "Next.js pre-warmer",
        handler: "index.handler",
        code: Code.fromInline(`
          const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda")
          const lambda = new LambdaClient({})

          exports.handler = async (event) => {
            if (event.RequestType === "Delete") {
              return { PhysicalResourceId: "prewarmer" }
            }

            try {
              await lambda.send(
                new InvokeCommand({
                  FunctionName: event.ResourceProperties.FunctionName,
                  InvocationType: "RequestResponse",
                })
              )
            } catch (error) {
              console.error("Pre-warming failed:", error)
            }

            return { PhysicalResourceId: "prewarmer" }
          }
        `),
        runtime: Runtime.NODEJS_24_X,
        architecture: Architecture.ARM_64,
        timeout: Duration.minutes(2),
        memorySize: 128,
        loggingFormat: LoggingFormat.JSON,
        logGroup: prewarmerLogGroup,
      })

      this.warmerFunction.grantInvoke(prewarmerFn)

      const provider = new Provider(this, "PrewarmerProvider", {
        onEventHandler: prewarmerFn,
        logGroup: prewarmerLogGroup,
      })

      // Create a deterministic version hash based on warmer configuration
      // This ensures pre-warming only triggers when config actually changes
      const configHash = createHash("sha256")
        .update(
          JSON.stringify({
            concurrency: warmConcurrency,
            interval: interval.toMinutes(),
            prewarmEnabled: this.props.prewarmOnDeploy,
          })
        )
        .digest("hex")
        .substring(0, 16) // Truncate for readability

      new CustomResource(this, "PrewarmerResource", {
        serviceToken: provider.serviceToken,
        properties: {
          FunctionName: this.warmerFunction.functionName,
          Version: configHash,
        },
      })
    }
  }

  private getEnvironment() {
    return {
      CACHE_BUCKET_NAME: this.bucket.bucketName,
      CACHE_BUCKET_KEY_PREFIX: "_cache",
      CACHE_BUCKET_REGION: Stack.of(this).region,
      REVALIDATION_QUEUE_URL: this.queue.queueUrl,
      REVALIDATION_QUEUE_REGION: Stack.of(this).region,
      CACHE_DYNAMO_TABLE: this.table.tableName,
      // Those 2 are used only for image optimizer
      BUCKET_NAME: this.bucket.bucketName,
      BUCKET_KEY_PREFIX: "_assets",
    }
  }

  private grantPermissions(grantable: IGrantable) {
    this.bucket.grantReadWrite(grantable)
    this.table.grantReadWriteData(grantable)
    this.queue.grantSendMessages(grantable)
  }

  private createFunctionOrigin(
    key: string,
    origin: OpenNextFunctionOrigin,
    originId?: string,
    fnProps?: DefaultFunctionProps
  ) {
    const environment = this.getEnvironment()
    const fn = new CdkFunction(this, `${key}Function`, {
      ...fnProps,
      runtime: fnProps?.runtime ?? Runtime.NODEJS_24_X,
      architecture: fnProps?.architecture ?? Architecture.ARM_64,
      memorySize: fnProps?.memorySize ?? 1024,
      loggingFormat: fnProps?.loggingFormat ?? LoggingFormat.JSON,
      handler: origin.handler,
      code: Code.fromAsset(path.join(this.openNextPath, "..", origin.bundle)),
      environment: {
        ...fnProps?.environment,
        ...environment,
      },
    })
    const fnUrl = fn.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      invokeMode: origin.streaming ? InvokeMode.RESPONSE_STREAM : InvokeMode.BUFFERED,
    })
    this.grantPermissions(fn)

    // Store reference to default server function
    if (key === "default") {
      this._defaultServerFunction = fn
    }

    return new HttpOrigin(Fn.parseDomainName(fnUrl.url), {
      ...(originId ? { originId } : {}),
    })
  }

  private createDistribution(
    origins: Record<string, IOrigin>,
    props: NextjsSiteProps,
    certificate?: ICertificate
  ) {
    const cloudfrontFunction = new CloudfrontFunction(this, "CloudFrontFunction", {
      code: FunctionCode.fromInline(`
			function handler(event) {
				var request = event.request;
				request.headers["x-forwarded-host"] = request.headers.host;
				return request;
			}
			`),
    })
    const fnAssociations = [
      {
        function: cloudfrontFunction,
        eventType: FunctionEventType.VIEWER_REQUEST,
      },
    ]

    const distribution = new Distribution(this, "Distribution", {
      domainNames: props.customDomain ? [props.customDomain.domainName] : undefined,
      certificate,
      defaultBehavior: {
        origin: origins.default!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: this.serverCachePolicy,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        functionAssociations: fnAssociations,
      },
      additionalBehaviors: this.openNextOutput.behaviors
        .filter((b) => b.pattern !== "*")
        .reduce(
          (acc, behavior) => {
            const behaviorOptions: BehaviorOptions = {
              origin: (behavior.origin ? origins[behavior.origin] : origins.default)!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
              viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
              cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
              cachePolicy:
                behavior.origin === "s3"
                  ? this.staticCachePolicy
                  : this.serverCachePolicy,
              ...(behavior.origin === "s3"
                ? {}
                : {
                    originRequestPolicy:
                      OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                  }),
              functionAssociations: fnAssociations,
            }
            acc[behavior.pattern] = behaviorOptions
            return acc
          },
          {} as Record<string, BehaviorOptions>
        ),
    })
    return distribution
  }

  private createServerCachePolicy() {
    return new CachePolicy(this, "OpenNextServerCachePolicy", {
      queryStringBehavior: CacheQueryStringBehavior.all(),
      headerBehavior: CacheHeaderBehavior.allowList(
        "accept",
        "accept-encoding",
        "rsc",
        "next-router-prefetch",
        "next-router-state-tree",
        "next-url",
        "x-prerender-revalidate"
      ),
      cookieBehavior: CacheCookieBehavior.none(),
      defaultTtl: Duration.days(0),
      maxTtl: Duration.days(365),
      minTtl: Duration.days(0),
    })
  }

  private createStaticCachePolicy() {
    return CachePolicy.CACHING_OPTIMIZED
  }
}
