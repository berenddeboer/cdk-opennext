import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { Template, Match } from "aws-cdk-lib/assertions"
import { Certificate } from "aws-cdk-lib/aws-certificatemanager"
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
            fn.Properties.MemorySize === 1024
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
        Timeout: 900, // 15 minutes
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
      // Spy on console.warn
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

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

      // Check that warning was logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Warming is enabled but OpenNext did not provide a warmer bundle"
        )
      )

      warnSpy.mockRestore()
    })
  })
})
