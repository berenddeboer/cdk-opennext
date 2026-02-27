import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { Annotations, Template, Match } from "aws-cdk-lib/assertions"
import { Certificate } from "aws-cdk-lib/aws-certificatemanager"
import { LogGroup } from "aws-cdk-lib/aws-logs"
import { HostedZone } from "aws-cdk-lib/aws-route53"
import { Duration, Stack } from "aws-cdk-lib/core"
import { NextjsSite } from "../src/open-next"

describe("NextjsSite", () => {
  let stack: Stack
  let testDir: string
  let openNextPath: string

  const mockOpenNextOutput = {
    edgeFunctions: {},
    origins: {
      s3: {
        type: "s3" as const,
        originPath: "/static",
        copy: [
          {
            from: "assets",
            to: "_assets",
            cached: true,
            versionedSubDir: "_next",
          },
        ],
      },
      default: {
        type: "function" as const,
        handler: "index.handler",
        bundle: "server-function",
        streaming: false,
      },
      imageOptimizer: {
        type: "function" as const,
        handler: "index.handler",
        bundle: "image-optimization-function",
        streaming: false,
      },
    },
    behaviors: [
      {
        pattern: "*",
        origin: "default",
      },
      {
        pattern: "_next/image*",
        origin: "imageOptimizer",
      },
      {
        pattern: "_next/static/*",
        origin: "s3",
      },
    ],
    additionalProps: {
      disableIncrementalCache: false,
      disableTagCache: false,
      revalidationFunction: {
        handler: "index.handler",
        bundle: "revalidation-function",
      },
      initializationFunction: {
        handler: "index.handler",
        bundle: "initialization-function",
      },
    },
  }

  beforeAll(() => {
    // Create temporary directory structure for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "open-next-test-"))
    openNextPath = path.join(testDir, ".open-next")

    // Create necessary directories
    fs.mkdirSync(openNextPath, { recursive: true })
    fs.mkdirSync(path.join(testDir, "assets"), { recursive: true })
    fs.mkdirSync(path.join(testDir, "server-function"), { recursive: true })
    fs.mkdirSync(path.join(testDir, "image-optimization-function"), {
      recursive: true,
    })
    fs.mkdirSync(path.join(testDir, "revalidation-function"), {
      recursive: true,
    })
    fs.mkdirSync(path.join(openNextPath, "dynamodb-provider"), {
      recursive: true,
    })

    // Create dummy Lambda handler files
    const dummyHandler = "exports.handler = async (event) => ({ statusCode: 200 });"
    fs.writeFileSync(path.join(testDir, "server-function", "index.js"), dummyHandler)
    fs.writeFileSync(
      path.join(testDir, "image-optimization-function", "index.js"),
      dummyHandler
    )
    fs.writeFileSync(
      path.join(testDir, "revalidation-function", "index.js"),
      dummyHandler
    )
    fs.writeFileSync(
      path.join(openNextPath, "dynamodb-provider", "index.js"),
      dummyHandler
    )

    // Create open-next.output.json
    fs.writeFileSync(
      path.join(openNextPath, "open-next.output.json"),
      JSON.stringify(mockOpenNextOutput)
    )
  })

  afterAll(() => {
    // Clean up test directory
    fs.rmSync(testDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    stack = new Stack()
  })

  describe("construct creation", () => {
    it("should create NextjsSite construct successfully", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      expect(construct).toBeDefined()
      expect(construct.distribution).toBeDefined()
      expect(construct.defaultServerFunction).toBeDefined()
    })
  })

  describe("infrastructure resources", () => {
    it("should create an S3 bucket with correct configuration", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)
      // Check that at least one bucket exists with public access blocked
      const buckets = template.findResources("AWS::S3::Bucket")
      const bucketValues = Object.values(buckets)

      expect(bucketValues.length).toBeGreaterThan(0)
      expect(
        bucketValues.some(
          (bucket: any) =>
            bucket.Properties.PublicAccessBlockConfiguration &&
            bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls === true &&
            bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets ===
              true
        )
      ).toBe(true)
    })

    it("should create a DynamoDB table for revalidation", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // DynamoDB TableV2 creates a GlobalTable
      const tables = template.findResources("AWS::DynamoDB::GlobalTable")
      const tableValues = Object.values(tables)

      expect(tableValues.length).toBeGreaterThan(0)
      expect(
        tableValues.some((table: any) => {
          const keySchema = table.Properties.KeySchema
          return (
            keySchema &&
            keySchema.some(
              (key: any) => key.AttributeName === "tag" && key.KeyType === "HASH"
            ) &&
            keySchema.some(
              (key: any) => key.AttributeName === "path" && key.KeyType === "RANGE"
            )
          )
        })
      ).toBe(true)
    })

    it("should create an SQS FIFO queue for revalidation", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)
      template.hasResourceProperties("AWS::SQS::Queue", {
        FifoQueue: true,
        ReceiveMessageWaitTimeSeconds: 20,
      })
    })

    it("should create Lambda functions for server and image optimization", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // Check for Lambda functions with nodejs24.x runtime
      const functions = template.findResources("AWS::Lambda::Function")
      const functionValues = Object.values(functions)

      expect(functionValues.length).toBeGreaterThan(0)
      expect(
        functionValues.some(
          (fn: any) =>
            fn.Properties.Runtime === "nodejs24.x" &&
            fn.Properties.Handler === "index.handler" &&
            fn.Properties.MemorySize === 1024 &&
            fn.Properties.Timeout === 10
        )
      ).toBe(true)
    })

    it("should create a revalidation function with SQS event source", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      template.hasResourceProperties("AWS::Lambda::EventSourceMapping", {
        BatchSize: 5,
      })
    })

    it("should create a CloudFront distribution", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      template.hasResourceProperties("AWS::CloudFront::Distribution", {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: "redirect-to-https",
            AllowedMethods: Match.arrayWith([
              "GET",
              "HEAD",
              "OPTIONS",
              "PUT",
              "PATCH",
              "POST",
              "DELETE",
            ]),
            CachedMethods: ["GET", "HEAD", "OPTIONS"],
          },
        },
      })
    })

    it("should create a CloudFront function for request transformation", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionConfig: {
          Runtime: "cloudfront-js-1.0",
        },
        FunctionCode: Match.stringLikeRegexp("x-forwarded-host"),
      })
    })

    it("should inject CloudFront geo-location headers", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // Verify geo-location header injection in CloudFront function
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("x-open-next-city"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("x-open-next-country"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("x-open-next-region"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("x-open-next-latitude"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("x-open-next-longitude"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("cloudfront-viewer-city"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("cloudfront-viewer-country"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("cloudfront-viewer-region"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("cloudfront-viewer-latitude"),
      })
      template.hasResourceProperties("AWS::CloudFront::Function", {
        FunctionCode: Match.stringLikeRegexp("cloudfront-viewer-longitude"),
      })
    })

    it("should grant proper permissions to Lambda functions", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // Check IAM policies for S3 access
      template.hasResourceProperties("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(["s3:GetObject*", "s3:GetBucket*", "s3:List*"]),
            }),
          ]),
        },
      })

      // Check IAM policies for DynamoDB access - BatchGetItem, Query, GetItem, Scan
      template.hasResourceProperties("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                "dynamodb:BatchGetItem",
                "dynamodb:Query",
                "dynamodb:GetItem",
                "dynamodb:Scan",
              ]),
            }),
          ]),
        },
      })

      // Check IAM policies for DynamoDB stream access - GetRecords, GetShardIterator
      template.hasResourceProperties("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
              ]),
            }),
          ]),
        },
      })

      // Check IAM policies for SQS access
      template.hasResourceProperties("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(["sqs:SendMessage"]),
            }),
          ]),
        },
      })
    })
  })

  describe("cache policies", () => {
    it("should create a server cache policy with correct configuration", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      template.hasResourceProperties("AWS::CloudFront::CachePolicy", {
        CachePolicyConfig: {
          DefaultTTL: 0,
          MaxTTL: 31536000, // 365 days
          MinTTL: 0,
          ParametersInCacheKeyAndForwardedToOrigin: {
            CookiesConfig: {
              CookieBehavior: "none",
            },
            HeadersConfig: {
              HeaderBehavior: "whitelist",
              Headers: Match.arrayWith(["accept", "rsc", "next-router-prefetch"]),
            },
            QueryStringsConfig: {
              QueryStringBehavior: "all",
            },
          },
        },
      })
    })
  })

  describe("bucket deployment", () => {
    it("should create bucket deployments for static assets", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // BucketDeployment creates a custom resource
      template.resourceCountIs("Custom::CDKBucketDeployment", 1)
    })
  })

  describe("custom resource for revalidation initialization", () => {
    it("should create a custom resource for revalidation data initialization", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // Check for custom resource with version property
      const resources = template.findResources("AWS::CloudFormation::CustomResource")
      expect(Object.keys(resources).length).toBeGreaterThan(0)
    })

    it("should create an initialization Lambda function", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // Find initialization function by checking for Timeout of 900 seconds
      template.hasResourceProperties("AWS::Lambda::Function", {
        Timeout: 900,
        MemorySize: 128,
      })
    })

    it("should grant batch write permission to initialization Lambda", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)
      const functions = template.findResources("AWS::Lambda::Function")
      const insertFunction = Object.values(functions).find(
        (fn: any) => fn.Properties?.Description === "Next.js revalidation data insert"
      )
      expect(insertFunction).toBeDefined()

      const roleLogicalId = (insertFunction as any).Properties.Role["Fn::GetAtt"][0]
      const policies = template.findResources("AWS::IAM::Policy")
      const insertFunctionPolicy = Object.values(policies).find((policy: any) =>
        (policy.Properties?.Roles ?? []).some((role: any) => role.Ref === roleLogicalId)
      )
      expect(insertFunctionPolicy).toBeDefined()

      const hasBatchWriteItem = (
        insertFunctionPolicy as any
      ).Properties.PolicyDocument.Statement.some((statement: any) => {
        const actions = Array.isArray(statement.Action)
          ? statement.Action
          : [statement.Action]

        return actions.includes("dynamodb:BatchWriteItem")
      })
      expect(hasBatchWriteItem).toBe(true)
    })
  })

  describe("function URLs", () => {
    it("should create function URLs with NONE auth type", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      template.hasResourceProperties("AWS::Lambda::Url", {
        AuthType: "NONE",
        InvokeMode: "BUFFERED",
      })
    })

    it("should support streaming for streaming origins", () => {
      // Create a new test directory with streaming enabled
      const streamingTestDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "open-next-streaming-test-")
      )
      const streamingOpenNextPath = path.join(streamingTestDir, ".open-next")

      fs.mkdirSync(streamingOpenNextPath, { recursive: true })
      fs.mkdirSync(path.join(streamingTestDir, "assets"), { recursive: true })
      fs.mkdirSync(path.join(streamingTestDir, "server-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(streamingTestDir, "image-optimization-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(streamingTestDir, "revalidation-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(streamingOpenNextPath, "dynamodb-provider"), {
        recursive: true,
      })

      const dummyHandler = "exports.handler = async (event) => ({ statusCode: 200 });"
      fs.writeFileSync(
        path.join(streamingTestDir, "server-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(streamingTestDir, "image-optimization-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(streamingTestDir, "revalidation-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(streamingOpenNextPath, "dynamodb-provider", "index.js"),
        dummyHandler
      )

      const streamingOutput = {
        ...mockOpenNextOutput,
        origins: {
          ...mockOpenNextOutput.origins,
          default: {
            ...mockOpenNextOutput.origins.default,
            streaming: true,
          },
        },
      }

      fs.writeFileSync(
        path.join(streamingOpenNextPath, "open-next.output.json"),
        JSON.stringify(streamingOutput)
      )

      const streamingStack = new Stack()
      new NextjsSite(streamingStack, "TestOpenNext", {
        openNextPath: streamingOpenNextPath,
      })

      const template = Template.fromStack(streamingStack)

      template.hasResourceProperties("AWS::Lambda::Url", {
        AuthType: "NONE",
        InvokeMode: "RESPONSE_STREAM",
      })

      // Cleanup
      fs.rmSync(streamingTestDir, { recursive: true, force: true })
    })

    it("should create image optimizer function URL with IAM auth for OAC", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // Image optimizer should use AWS_IAM auth type for Origin Access Control
      template.hasResourceProperties("AWS::Lambda::Url", {
        AuthType: "AWS_IAM",
      })
    })

    it("should create Origin Access Control for image optimizer", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)

      // Verify OAC is created for Lambda function URL
      template.hasResourceProperties("AWS::CloudFront::OriginAccessControl", {
        OriginAccessControlConfig: {
          OriginAccessControlOriginType: "lambda",
          SigningBehavior: "always",
          SigningProtocol: "sigv4",
        },
      })
    })
  })

  describe("defaultServerFunction getter", () => {
    it("should expose the default server function", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      expect(construct.defaultServerFunction).toBeDefined()
      expect(construct.defaultServerFunction.node.id).toContain("defaultFunction")
    })
  })

  describe("custom environment variables", () => {
    it("should add custom environment variables to the default server function", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        defaultFunctionProps: {
          environment: {
            CUSTOM_VAR: "custom-value",
            ANOTHER_VAR: "another-value",
          },
        },
      })

      const template = Template.fromStack(stack)

      // Check that custom environment variables are added to Lambda functions
      template.hasResourceProperties("AWS::Lambda::Function", {
        Environment: {
          Variables: Match.objectLike({
            CUSTOM_VAR: "custom-value",
            ANOTHER_VAR: "another-value",
          }),
        },
      })
    })

    it("should not allow custom environment variables to overwrite defaults", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        defaultFunctionProps: {
          environment: {
            CACHE_BUCKET_NAME: "should-not-overwrite",
            CUSTOM_VAR: "custom-value",
          },
        },
      })

      const template = Template.fromStack(stack)

      // Check that default environment variables take precedence
      const functions = template.findResources("AWS::Lambda::Function")
      const functionValues = Object.values(functions)

      // Find the default server function (has memorySize 1024)
      const serverFunction = functionValues.find(
        (fn: any) => fn.Properties?.MemorySize === 1024
      )

      expect(serverFunction).toBeDefined()
      const envVars = (serverFunction as any).Properties.Environment.Variables

      // Custom var should be present
      expect(envVars.CUSTOM_VAR).toBe("custom-value")

      // Default var should NOT be overwritten
      expect(envVars.CACHE_BUCKET_NAME).not.toBe("should-not-overwrite")
      expect(envVars.CACHE_BUCKET_NAME).toBeDefined()
    })
  })

  describe("custom domain configuration", () => {
    it("should create certificate and DNS records when custom domain is provided", () => {
      const customStack = new Stack(undefined, undefined, {
        env: { account: "123456789012", region: "us-east-1" },
      })

      // Create a mock hosted zone
      const hostedZone = HostedZone.fromHostedZoneAttributes(customStack, "HostedZone", {
        hostedZoneId: "Z1234567890ABC",
        zoneName: "example.com",
      })

      new NextjsSite(customStack, "TestOpenNext", {
        openNextPath: openNextPath,
        customDomain: {
          domainName: "app.example.com",
          hostedZone: hostedZone,
        },
      })

      const template = Template.fromStack(customStack)

      // Check that a certificate custom resource is created (DnsValidatedCertificate creates a custom resource)
      const resources = template.findResources("AWS::CloudFormation::CustomResource")
      const certResource = Object.values(resources).find(
        (resource: any) =>
          resource.Properties?.DomainName === "app.example.com" &&
          resource.Properties?.HostedZoneId === "Z1234567890ABC" &&
          resource.Properties?.Region === "us-east-1"
      )
      expect(certResource).toBeDefined()

      // Check that CloudFront distribution has the custom domain
      template.hasResourceProperties("AWS::CloudFront::Distribution", {
        DistributionConfig: {
          Aliases: ["app.example.com"],
        },
      })

      // Check that A record is created
      template.hasResourceProperties("AWS::Route53::RecordSet", {
        Name: "app.example.com.",
        Type: "A",
        HostedZoneId: "Z1234567890ABC",
      })

      // Check that AAAA record is created
      template.hasResourceProperties("AWS::Route53::RecordSet", {
        Name: "app.example.com.",
        Type: "AAAA",
        HostedZoneId: "Z1234567890ABC",
      })
    })

    it("should expose custom domain URL", () => {
      const customStack = new Stack(undefined, undefined, {
        env: { account: "123456789012", region: "us-east-1" },
      })

      const hostedZone = HostedZone.fromHostedZoneAttributes(customStack, "HostedZone", {
        hostedZoneId: "Z1234567890ABC",
        zoneName: "example.com",
      })

      const construct = new NextjsSite(customStack, "TestOpenNext", {
        openNextPath: openNextPath,
        customDomain: {
          domainName: "app.example.com",
          hostedZone: hostedZone,
        },
      })

      expect(construct.customDomainUrl).toBe("https://app.example.com")
      expect(construct.url).toContain("https://")
    })

    it("should use provided certificate instead of creating one", () => {
      const customStack = new Stack(undefined, undefined, {
        env: { account: "123456789012", region: "us-east-1" },
      })

      // Import an existing certificate
      const certificate = Certificate.fromCertificateArn(
        customStack,
        "Certificate",
        "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
      )

      new NextjsSite(customStack, "TestOpenNext", {
        openNextPath: openNextPath,
        customDomain: {
          domainName: "app.example.com",
          certificate: certificate,
        },
      })

      const template = Template.fromStack(customStack)

      // Check that CloudFront distribution has the custom domain
      template.hasResourceProperties("AWS::CloudFront::Distribution", {
        DistributionConfig: {
          Aliases: ["app.example.com"],
        },
      })

      // No DnsValidatedCertificate custom resource should be created
      const resources = template.findResources("AWS::CloudFormation::CustomResource")
      const certResource = Object.values(resources).find(
        (resource: any) =>
          resource.Properties?.DomainName === "app.example.com" &&
          resource.Properties?.Region === "us-east-1"
      )
      expect(certResource).toBeUndefined()

      // No Route53 records should be created (no hostedZone provided)
      template.resourceCountIs("AWS::Route53::RecordSet", 0)
    })

    it("should use provided certificate and create DNS records when both are provided", () => {
      const customStack = new Stack(undefined, undefined, {
        env: { account: "123456789012", region: "us-east-1" },
      })

      const hostedZone = HostedZone.fromHostedZoneAttributes(customStack, "HostedZone", {
        hostedZoneId: "Z1234567890ABC",
        zoneName: "example.com",
      })

      const certificate = Certificate.fromCertificateArn(
        customStack,
        "Certificate",
        "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
      )

      new NextjsSite(customStack, "TestOpenNext", {
        openNextPath: openNextPath,
        customDomain: {
          domainName: "app.example.com",
          hostedZone: hostedZone,
          certificate: certificate,
        },
      })

      const template = Template.fromStack(customStack)

      // Check that CloudFront distribution has the custom domain
      template.hasResourceProperties("AWS::CloudFront::Distribution", {
        DistributionConfig: {
          Aliases: ["app.example.com"],
        },
      })

      // No DnsValidatedCertificate custom resource should be created
      const resources = template.findResources("AWS::CloudFormation::CustomResource")
      const certResource = Object.values(resources).find(
        (resource: any) =>
          resource.Properties?.DomainName === "app.example.com" &&
          resource.Properties?.Region === "us-east-1"
      )
      expect(certResource).toBeUndefined()

      // Route53 records should be created
      template.hasResourceProperties("AWS::Route53::RecordSet", {
        Name: "app.example.com.",
        Type: "A",
        HostedZoneId: "Z1234567890ABC",
      })

      template.hasResourceProperties("AWS::Route53::RecordSet", {
        Name: "app.example.com.",
        Type: "AAAA",
        HostedZoneId: "Z1234567890ABC",
      })
    })

    it("should throw error when customDomain has neither certificate nor hostedZone", () => {
      expect(() => {
        new NextjsSite(stack, "TestOpenNext", {
          openNextPath: openNextPath,
          customDomain: {
            domainName: "app.example.com",
          },
        })
      }).toThrow(
        "customDomain requires either a certificate or a hostedZone. " +
          "Provide a hostedZone to automatically create a DNS-validated certificate, " +
          "or provide your own certificate."
      )
    })
  })

  describe("Lambda warming", () => {
    let warmerTestDir: string
    let warmerOpenNextPath: string

    beforeAll(() => {
      // Create temporary directory with warmer support
      warmerTestDir = fs.mkdtempSync(path.join(os.tmpdir(), "warmer-test-"))
      warmerOpenNextPath = path.join(warmerTestDir, ".open-next")

      // Create necessary directories
      fs.mkdirSync(warmerOpenNextPath, { recursive: true })
      fs.mkdirSync(path.join(warmerTestDir, "assets"), { recursive: true })
      fs.mkdirSync(path.join(warmerTestDir, "server-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerTestDir, "image-optimization-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerTestDir, "revalidation-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerTestDir, "warmer-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerOpenNextPath, "dynamodb-provider"), {
        recursive: true,
      })

      // Create dummy handler files
      const dummyHandler = "exports.handler = async (event) => ({ statusCode: 200 });"
      fs.writeFileSync(
        path.join(warmerTestDir, "server-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerTestDir, "image-optimization-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerTestDir, "revalidation-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerTestDir, "warmer-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerOpenNextPath, "dynamodb-provider", "index.js"),
        dummyHandler
      )

      // Create open-next.output.json with warmer
      const outputWithWarmer = {
        ...mockOpenNextOutput,
        additionalProps: {
          ...mockOpenNextOutput.additionalProps,
          warmer: {
            handler: "index.handler",
            bundle: "warmer-function",
          },
        },
      }
      fs.writeFileSync(
        path.join(warmerOpenNextPath, "open-next.output.json"),
        JSON.stringify(outputWithWarmer)
      )
    })

    afterAll(() => {
      fs.rmSync(warmerTestDir, { recursive: true, force: true })
    })

    it("should create warmer by default with warm: 1", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
      })

      const template = Template.fromStack(warmerStack)

      // Check warmer function exists
      template.hasResourceProperties("AWS::Lambda::Function", {
        Description: "Next.js warmer",
        Runtime: "nodejs24.x",
        MemorySize: 128,
        Timeout: 60, // 1 minute
      })
    })

    it("should not create warmer when warm: false", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warm: false,
      })

      const template = Template.fromStack(warmerStack)

      // Check that warmer function does not exist
      const functions = template.findResources("AWS::Lambda::Function")
      const warmerFunction = Object.values(functions).find((fn: any) => {
        const desc = fn.Properties?.Description
        return typeof desc === "string" && desc.includes("warmer")
      })
      expect(warmerFunction).toBeUndefined()

      // No EventBridge rule should be created
      expect(() => {
        template.hasResourceProperties("AWS::Events::Rule", {
          ScheduleExpression: Match.anyValue(),
        })
      }).toThrow()
    })

    it("should not create warmer when warm: 0", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warm: 0,
      })

      const template = Template.fromStack(warmerStack)

      // Check that warmer function does not exist
      const functions = template.findResources("AWS::Lambda::Function")
      const warmerFunction = Object.values(functions).find((fn: any) => {
        const desc = fn.Properties?.Description
        return typeof desc === "string" && desc.includes("warmer")
      })
      expect(warmerFunction).toBeUndefined()

      // No EventBridge rule should be created
      expect(() => {
        template.hasResourceProperties("AWS::Events::Rule", {
          ScheduleExpression: Match.anyValue(),
        })
      }).toThrow()
    })

    it("should not create warmer when warm is negative", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warm: -5,
      })

      const template = Template.fromStack(warmerStack)

      // Check that warmer function does not exist
      const functions = template.findResources("AWS::Lambda::Function")
      const warmerFunction = Object.values(functions).find((fn: any) => {
        const desc = fn.Properties?.Description
        return typeof desc === "string" && desc.includes("warmer")
      })
      expect(warmerFunction).toBeUndefined()
    })

    it("should create warmer with custom concurrency", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warm: 5,
      })

      const template = Template.fromStack(warmerStack)

      // Find warmer function and check WARM_PARAMS
      const functions = template.findResources("AWS::Lambda::Function")
      const warmerFunction = Object.values(functions).find((fn: any) => {
        const desc = fn.Properties?.Description
        return typeof desc === "string" && desc.includes("Next.js warmer")
      })

      expect(warmerFunction).toBeDefined()
      const envVars = (warmerFunction as any).Properties.Environment.Variables
      expect(envVars.WARM_PARAMS).toBeDefined()

      // WARM_PARAMS should contain JSON string with the right structure
      const warmParamsStr =
        typeof envVars.WARM_PARAMS === "string"
          ? envVars.WARM_PARAMS
          : JSON.stringify(envVars.WARM_PARAMS)

      // Check that it contains expected values (may be a CDK token)
      expect(warmParamsStr).toContain("concurrency")
      expect(warmParamsStr).toContain("5")
      expect(warmParamsStr).toContain("function")
    })

    it("should create EventBridge rule with default 5 minute interval", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
      })

      const template = Template.fromStack(warmerStack)

      template.hasResourceProperties("AWS::Events::Rule", {
        ScheduleExpression: "rate(5 minutes)",
        State: "ENABLED",
      })
    })

    it("should create EventBridge rule with custom interval", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warmerInterval: Duration.minutes(10),
      })

      const template = Template.fromStack(warmerStack)

      template.hasResourceProperties("AWS::Events::Rule", {
        ScheduleExpression: "rate(10 minutes)",
      })
    })

    it("should grant invoke permissions to warmer function", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warm: 3,
      })

      const template = Template.fromStack(warmerStack)

      // Check IAM policy for Lambda invoke permission
      template.hasResourceProperties("AWS::IAM::Policy", {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: "lambda:InvokeFunction",
              Effect: "Allow",
            }),
          ]),
        },
      })
    })

    it("should set WARMER_ENABLED environment variable on server function", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warm: 2,
      })

      const template = Template.fromStack(warmerStack)

      // Find server function (has memorySize 1024 by default)
      const functions = template.findResources("AWS::Lambda::Function")
      const serverFunction = Object.values(functions).find(
        (fn: any) => fn.Properties?.MemorySize === 1024
      )

      expect(serverFunction).toBeDefined()
      const envVars = (serverFunction as any).Properties.Environment.Variables
      expect(envVars.WARMER_ENABLED).toBe("true")
    })

    it("should create pre-warmer custom resource by default", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
      })

      const template = Template.fromStack(warmerStack)

      // Check for pre-warmer function
      template.hasResourceProperties("AWS::Lambda::Function", {
        Description: "Next.js pre-warmer",
      })

      // Check for custom resource
      const resources = template.findResources("AWS::CloudFormation::CustomResource")
      const prewarmerResource = Object.values(resources).find(
        (resource: any) => resource.Properties?.FunctionName
      )
      expect(prewarmerResource).toBeDefined()
    })

    it("should not create pre-warmer when prewarmOnDeploy is false", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        prewarmOnDeploy: false,
      })

      const template = Template.fromStack(warmerStack)

      // Check that pre-warmer function does not exist
      const functions = template.findResources("AWS::Lambda::Function")
      const prewarmerFunction = Object.values(functions).find((fn: any) => {
        const desc = fn.Properties?.Description
        return typeof desc === "string" && desc.includes("pre-warmer")
      })
      expect(prewarmerFunction).toBeUndefined()
    })

    it("should configure EventBridge rule with retryAttempts 0", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
      })

      const template = Template.fromStack(warmerStack)

      // Find the EventBridge target configuration
      template.hasResourceProperties("AWS::Events::Rule", {
        Targets: Match.arrayWith([
          Match.objectLike({
            RetryPolicy: {
              MaximumRetryAttempts: 0,
            },
          }),
        ]),
      })
    })

    it("should skip warmer creation when OpenNext does not provide warmer bundle", () => {
      const warmerStack = new Stack()
      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: openNextPath, // Use the original path without warmer
        warm: 3,
      })

      const template = Template.fromStack(warmerStack)

      // Check that warmer function does not exist
      const functions = template.findResources("AWS::Lambda::Function")
      const warmerFunction = Object.values(functions).find((fn: any) => {
        const desc = fn.Properties?.Description
        return typeof desc === "string" && desc.includes("warmer")
      })
      expect(warmerFunction).toBeUndefined()

      // Check that warning annotation was added
      const annotations = Annotations.fromStack(warmerStack)
      annotations.hasWarning(
        "/Default/TestOpenNext",
        Match.stringLikeRegexp(
          ".*Warming is enabled but OpenNext did not provide a warmer bundle.*"
        )
      )
    })
  })

  describe("headless mode (createDistribution: false)", () => {
    it("should not create a CloudFront distribution when createDistribution is false", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      const template = Template.fromStack(stack)

      // No CloudFront distribution should be created
      const distributions = template.findResources("AWS::CloudFront::Distribution")
      expect(Object.keys(distributions).length).toBe(0)
    })

    it("should still create all compute and storage resources in headless mode", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      const template = Template.fromStack(stack)

      // S3 bucket should exist
      const buckets = template.findResources("AWS::S3::Bucket")
      expect(Object.keys(buckets).length).toBeGreaterThan(0)

      // DynamoDB table should exist
      const tables = template.findResources("AWS::DynamoDB::GlobalTable")
      expect(Object.keys(tables).length).toBeGreaterThan(0)

      // SQS queue should exist
      template.hasResourceProperties("AWS::SQS::Queue", {
        FifoQueue: true,
      })

      // Lambda functions should exist
      const functions = template.findResources("AWS::Lambda::Function")
      expect(Object.keys(functions).length).toBeGreaterThan(0)
    })

    it("should expose origins in headless mode", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      expect(construct.origins).toBeDefined()
      expect(construct.origins.default).toBeDefined()
      expect(construct.origins.s3).toBeDefined()
      expect(construct.origins.imageOptimizer).toBeDefined()
    })

    it("should expose behaviors in headless mode", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      expect(construct.behaviors).toBeDefined()
      expect(construct.behaviors.length).toBeGreaterThan(0)
      expect(construct.behaviors.some((b) => b.pattern === "*")).toBe(true)
      expect(construct.behaviors.some((b) => b.pattern === "_next/static/*")).toBe(true)
    })

    it("should expose cache policies in headless mode", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      expect(construct.serverCachePolicy).toBeDefined()
      expect(construct.staticCachePolicy).toBeDefined()
    })

    it("should expose cloudfrontFunctionCode in headless mode", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      expect(construct.cloudfrontFunctionCode).toBeDefined()
      expect(construct.cloudfrontFunctionCode).toContain("x-forwarded-host")
      expect(construct.cloudfrontFunctionCode).toContain("cloudfront-viewer-city")
    })

    it("should have undefined distribution in headless mode", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      expect(construct.distribution).toBeUndefined()
    })

    it("should throw when accessing url in headless mode", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      expect(() => construct.url).toThrow(
        "Distribution not available. Set createDistribution: true"
      )
    })

    it("should throw when accessing customDomainUrl in headless mode", () => {
      const construct = new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      expect(() => construct.customDomainUrl).toThrow(
        "Distribution not available. Set createDistribution: true"
      )
    })

    it("should throw at construct time when createDistribution is false with customDomain", () => {
      expect(() => {
        new NextjsSite(stack, "TestOpenNext", {
          openNextPath: openNextPath,
          createDistribution: false,
          customDomain: {
            domainName: "app.example.com",
          },
        })
      }).toThrow("customDomain cannot be used when createDistribution is false")
    })

    it("should not create Route53 records in headless mode", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      const template = Template.fromStack(stack)

      // No Route53 records should be created
      template.resourceCountIs("AWS::Route53::RecordSet", 0)
    })

    it("should create cache policies even in headless mode", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        createDistribution: false,
      })

      const template = Template.fromStack(stack)

      // Server cache policy should be created
      template.hasResourceProperties("AWS::CloudFront::CachePolicy", {
        CachePolicyConfig: {
          DefaultTTL: 0,
        },
      })
    })
  })

  describe("environment variable separation", () => {
    it("should only set CACHE_BUCKET_NAME on server functions, not BUCKET_NAME", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)
      const functions = template.findResources("AWS::Lambda::Function")

      // Find the default server function (memorySize 1024 with CACHE_BUCKET_NAME)
      const serverFunction = Object.values(functions).find(
        (fn: any) =>
          fn.Properties?.MemorySize === 1024 &&
          fn.Properties?.Environment?.Variables?.CACHE_BUCKET_NAME
      )

      expect(serverFunction).toBeDefined()
      const envVars = (serverFunction as any).Properties.Environment.Variables
      expect(envVars.CACHE_BUCKET_NAME).toBeDefined()
      expect(envVars.CACHE_BUCKET_KEY_PREFIX).toBe("_cache")
      expect(envVars.BUCKET_NAME).toBeUndefined()
      expect(envVars.BUCKET_KEY_PREFIX).toBeUndefined()
    })

    it("should only set BUCKET_NAME on image optimizer, not CACHE_BUCKET_NAME", () => {
      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
      })

      const template = Template.fromStack(stack)
      const functions = template.findResources("AWS::Lambda::Function")

      // Find the image optimizer function (has BUCKET_NAME env var)
      const imageFunction = Object.values(functions).find(
        (fn: any) => fn.Properties?.Environment?.Variables?.BUCKET_NAME
      )

      expect(imageFunction).toBeDefined()
      const envVars = (imageFunction as any).Properties.Environment.Variables
      expect(envVars.BUCKET_NAME).toBeDefined()
      expect(envVars.BUCKET_KEY_PREFIX).toBe("_assets")
      expect(envVars.CACHE_BUCKET_NAME).toBeUndefined()
      expect(envVars.CACHE_BUCKET_KEY_PREFIX).toBeUndefined()
    })
  })

  describe("logGroup prop", () => {
    it("should apply logGroup to server, image optimizer, and revalidation functions", () => {
      const logGroup = new LogGroup(stack, "TestLogGroup")

      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        logGroup,
      })

      const template = Template.fromStack(stack)
      const functions = template.findResources("AWS::Lambda::Function")
      const logGroupLogicalIds = Object.keys(
        template.findResources("AWS::Logs::LogGroup")
      )
      const testLogGroupId = logGroupLogicalIds.find((id) =>
        id.startsWith("TestLogGroup")
      )
      expect(testLogGroupId).toBeDefined()

      // Server function (memorySize 1024 with CACHE_BUCKET_NAME)
      const serverFn = Object.values(functions).find(
        (fn: any) =>
          fn.Properties?.MemorySize === 1024 &&
          fn.Properties?.Environment?.Variables?.CACHE_BUCKET_NAME
      )
      expect(serverFn).toBeDefined()
      expect(JSON.stringify((serverFn as any).Properties.LoggingConfig)).toContain(
        testLogGroupId
      )

      // Image optimizer function (has BUCKET_NAME)
      const imageFn = Object.values(functions).find(
        (fn: any) => fn.Properties?.Environment?.Variables?.BUCKET_NAME
      )
      expect(imageFn).toBeDefined()
      expect(JSON.stringify((imageFn as any).Properties.LoggingConfig)).toContain(
        testLogGroupId
      )

      // Revalidation insert function (memorySize 128, timeout 900s)
      const revalidationInsertFn = Object.values(functions).find(
        (fn: any) => fn.Properties?.Description === "Next.js revalidation data insert"
      )
      expect(revalidationInsertFn).toBeDefined()
      expect(
        JSON.stringify((revalidationInsertFn as any).Properties.LoggingConfig)
      ).toContain(testLogGroupId)

      // Revalidation consumer function
      const revalidationFn = Object.values(functions).find(
        (fn: any) => fn.Properties?.Description === "Next.js revalidator"
      )
      expect(revalidationFn).toBeDefined()
      expect(JSON.stringify((revalidationFn as any).Properties.LoggingConfig)).toContain(
        testLogGroupId
      )
    })

    it("should prefer defaultFunctionProps.logGroup over props.logGroup", () => {
      const siteLogGroup = new LogGroup(stack, "SiteLogGroup")
      const overrideLogGroup = new LogGroup(stack, "OverrideLogGroup")

      new NextjsSite(stack, "TestOpenNext", {
        openNextPath: openNextPath,
        logGroup: siteLogGroup,
        defaultFunctionProps: {
          logGroup: overrideLogGroup,
        },
      })

      const template = Template.fromStack(stack)
      const functions = template.findResources("AWS::Lambda::Function")
      const logGroupLogicalIds = Object.keys(
        template.findResources("AWS::Logs::LogGroup")
      )
      const overrideLogGroupId = logGroupLogicalIds.find((id) =>
        id.startsWith("OverrideLogGroup")
      )
      expect(overrideLogGroupId).toBeDefined()

      // Server function should use the override log group
      const serverFn = Object.values(functions).find(
        (fn: any) =>
          fn.Properties?.MemorySize === 1024 &&
          fn.Properties?.Environment?.Variables?.CACHE_BUCKET_NAME
      )
      expect(serverFn).toBeDefined()
      expect(JSON.stringify((serverFn as any).Properties.LoggingConfig)).toContain(
        overrideLogGroupId
      )
    })
  })

  describe("warmerLogGroup prop", () => {
    let warmerTestDir: string
    let warmerOpenNextPath: string

    beforeAll(() => {
      warmerTestDir = fs.mkdtempSync(path.join(os.tmpdir(), "warmer-lg-test-"))
      warmerOpenNextPath = path.join(warmerTestDir, ".open-next")

      fs.mkdirSync(warmerOpenNextPath, { recursive: true })
      fs.mkdirSync(path.join(warmerTestDir, "assets"), { recursive: true })
      fs.mkdirSync(path.join(warmerTestDir, "server-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerTestDir, "image-optimization-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerTestDir, "revalidation-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerTestDir, "warmer-function"), {
        recursive: true,
      })
      fs.mkdirSync(path.join(warmerOpenNextPath, "dynamodb-provider"), {
        recursive: true,
      })

      const dummyHandler = "exports.handler = async (event) => ({ statusCode: 200 });"
      fs.writeFileSync(
        path.join(warmerTestDir, "server-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerTestDir, "image-optimization-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerTestDir, "revalidation-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerTestDir, "warmer-function", "index.js"),
        dummyHandler
      )
      fs.writeFileSync(
        path.join(warmerOpenNextPath, "dynamodb-provider", "index.js"),
        dummyHandler
      )

      const outputWithWarmer = {
        ...mockOpenNextOutput,
        additionalProps: {
          ...mockOpenNextOutput.additionalProps,
          warmer: {
            handler: "index.handler",
            bundle: "warmer-function",
          },
        },
      }
      fs.writeFileSync(
        path.join(warmerOpenNextPath, "open-next.output.json"),
        JSON.stringify(outputWithWarmer)
      )
    })

    afterAll(() => {
      fs.rmSync(warmerTestDir, { recursive: true, force: true })
    })

    it("should apply warmerLogGroup to warmer and pre-warmer functions", () => {
      const warmerStack = new Stack()
      const logGroup = new LogGroup(warmerStack, "WarmerLogs")

      new NextjsSite(warmerStack, "TestOpenNext", {
        openNextPath: warmerOpenNextPath,
        warmerLogGroup: logGroup,
      })

      const template = Template.fromStack(warmerStack)
      const functions = template.findResources("AWS::Lambda::Function")
      const logGroupLogicalIds = Object.keys(
        template.findResources("AWS::Logs::LogGroup")
      )
      const warmerLogGroupId = logGroupLogicalIds.find((id) =>
        id.startsWith("WarmerLogs")
      )
      expect(warmerLogGroupId).toBeDefined()

      // Warmer function
      const warmerFn = Object.values(functions).find(
        (fn: any) => fn.Properties?.Description === "Next.js warmer"
      )
      expect(warmerFn).toBeDefined()
      expect(JSON.stringify((warmerFn as any).Properties.LoggingConfig)).toContain(
        warmerLogGroupId
      )

      // Pre-warmer function
      const prewarmerFn = Object.values(functions).find(
        (fn: any) => fn.Properties?.Description === "Next.js pre-warmer"
      )
      expect(prewarmerFn).toBeDefined()
      expect(JSON.stringify((prewarmerFn as any).Properties.LoggingConfig)).toContain(
        warmerLogGroupId
      )
    })
  })
})
