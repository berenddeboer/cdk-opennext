import { readFileSync } from "fs"
import * as path from "path"
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
import { type IGrantable } from "aws-cdk-lib/aws-iam"
import {
  Code,
  Function as CdkFunction,
  FunctionUrlAuthType,
  InvokeMode,
  Runtime,
  Architecture,
} from "aws-cdk-lib/aws-lambda"
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources"
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"
import { Queue } from "aws-cdk-lib/aws-sqs"
import { CustomResource, Duration, Fn, RemovalPolicy, Stack } from "aws-cdk-lib/core"
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

export interface NextjsSiteProps {
  /**
   * Should point to the .open-next directory.
   */
  readonly openNextPath: string
}

export class NextjsSite extends Construct {
  private openNextOutput: OpenNextOutput
  private bucket: Bucket
  private table: Table
  private queue: Queue

  private staticCachePolicy: ICachePolicy
  private serverCachePolicy: CachePolicy

  public readonly distribution: Distribution
  private _defaultServerFunction!: CdkFunction

  public get defaultServerFunction(): CdkFunction {
    return this._defaultServerFunction
  }

  constructor(scope: Construct, id: string, props: NextjsSiteProps) {
    super(scope, id)
    this.openNextOutput = JSON.parse(
      readFileSync(path.join(props.openNextPath, "open-next.output.json"), "utf-8")
    ) as OpenNextOutput

    this.bucket = new Bucket(this, "OpenNextBucket", {
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      enforceSSL: true,
    })
    this.table = this.createRevalidationTable(props)
    this.queue = this.createRevalidationQueue(props)

    const origins = this.createOrigins(props)
    this.serverCachePolicy = this.createServerCachePolicy()
    this.staticCachePolicy = this.createStaticCachePolicy()
    this.distribution = this.createDistribution(origins)
  }

  private createRevalidationTable(props: NextjsSiteProps) {
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
      code: Code.fromAsset(path.join(props.openNextPath, "dynamodb-provider")),
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.minutes(15),
      memorySize: 128,
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

  private createOrigins(props: NextjsSiteProps) {
    const {
      s3: s3Origin,
      default: defaultOrigin,
      imageOptimizer: imageOrigin,
      ...restOrigins
    } = this.openNextOutput.origins
    for (const copy of s3Origin.copy) {
      new BucketDeployment(this, `OpenNextBucketDeployment${copy.from}`, {
        sources: [Source.asset(path.join(props.openNextPath, "..", copy.from))],
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
      default: this.createFunctionOrigin("default", defaultOrigin, props, "NextJsServer"),
      imageOptimizer: this.createFunctionOrigin(
        "imageOptimizer",
        imageOrigin,
        props,
        "ImageOptimizer"
      ),
      ...Object.entries(restOrigins).reduce(
        (acc, [key, value]) => {
          const originId = key.charAt(0).toUpperCase() + key.slice(1)
          if (value.type === "function") {
            acc[key] = this.createFunctionOrigin(key, value, props, originId)
          }
          return acc
        },
        {} as Record<string, HttpOrigin>
      ),
    }
    return origins
  }

  private createRevalidationQueue(props: NextjsSiteProps) {
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
              props.openNextPath,
              "..",
              this.openNextOutput.additionalProps?.revalidationFunction?.bundle
            )
          : ""
      ),
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(30),
    })
    consumer.addEventSource(new SqsEventSource(queue, { batchSize: 5 }))
    return queue
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
    props: NextjsSiteProps,
    originId?: string
  ) {
    const environment = this.getEnvironment()
    const fn = new CdkFunction(this, `${key}Function`, {
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      handler: origin.handler,
      code: Code.fromAsset(path.join(props.openNextPath, "..", origin.bundle)),
      environment,
      memorySize: 1024,
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

  private createDistribution(origins: Record<string, IOrigin>) {
    const cloudfrontFunction = new CloudfrontFunction(this, "OpenNextCfFunction", {
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

    const distribution = new Distribution(this, "OpenNextDistribution", {
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
