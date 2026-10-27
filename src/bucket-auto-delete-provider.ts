import { existsSync, readFileSync } from "fs"
import * as path from "path"
import { IRole } from "aws-cdk-lib/aws-iam"
import { Code } from "aws-cdk-lib/aws-lambda"
import { CfnResource, determineLatestNodeRuntimeName, Stack } from "aws-cdk-lib/core"
import { Construct } from "constructs"
import { grantLogging, sameRole } from "./role-helpers"

/**
 * Adapter for CDK's stack singleton, which has no public execution-role input.
 * Keep the singleton and Handler paths identical to CDK's provider: changing
 * the service token can send a Delete to the old provider and empty the bucket.
 * The CDK handler (including its deletion safeguards) is deliberately reused.
 * Template compatibility is tested against the minimum and latest CDK 2.x.
 * Remove this shim when CDK exposes a role input that preserves these identities:
 * https://github.com/aws/aws-cdk/issues/16496
 *
 * @internal
 */
export class SuppliedRoleBucketAutoDeleteProvider extends Construct {
  public static prepare(scope: Construct, role?: IRole): void {
    const stack = Stack.of(scope)
    // CDK aws-s3 AutoDeleteObjectsProvider.getOrCreateProvider's stack child ID.
    const id = "Custom::S3AutoDeleteObjectsCustomResourceProvider"
    const existing = stack.node.tryFindChild(id)
    if (existing) {
      if (
        role &&
        existing instanceof SuppliedRoleBucketAutoDeleteProvider &&
        sameRole(stack, existing.executionRole, role)
      ) {
        grantLogging(role)
        // Reset for this site's synchronous prepare -> Bucket -> assertBound
        // sequence; an earlier bucket's read must not mask a later lookup failure.
        existing.bound = false
        return
      }
      if (!role && !(existing instanceof SuppliedRoleBucketAutoDeleteProvider)) return
      throw new Error(
        "Incompatible S3 auto-delete singleton roles: all sites and auto-delete " +
          "buckets in a stack must use the same supplied role, or all use generated roles. " +
          "Reuse the same IRole object to avoid differently tokenized ARN imports."
      )
    }
    if (role) new SuppliedRoleBucketAutoDeleteProvider(stack, id, role)
  }

  public readonly roleArn: string
  public readonly executionRole: IRole
  private readonly token: string
  private bound = false

  constructor(scope: Construct, id: string, role: IRole) {
    super(scope, id)
    this.roleArn = role.roleArn
    this.executionRole = role
    let directory: string
    try {
      directory = path.join(
        path.dirname(require.resolve("aws-cdk-lib/package.json")),
        // Bundled by CDK's generated AutoDeleteObjectsProvider implementation.
        "custom-resource-handlers/dist/aws-s3/auto-delete-objects-handler"
      )
    } catch {
      throw new Error(
        "Cannot locate aws-cdk-lib's auto-delete handler. Keep aws-cdk-lib " +
          "external when bundling cdk-opennext and include its handler assets."
      )
    }
    if (!existsSync(path.join(directory, "index.js"))) {
      throw new Error(
        `Unsupported CDK auto-delete handler layout: missing ${directory}/index.js. ` +
          "Use a tested CDK version with its bundled handler assets installed."
      )
    }
    let code: Record<string, string>
    if (this.node.tryGetContext("@aws-cdk/core:inlineCustomResourceIfPossible")) {
      code = { ZipFile: readFileSync(path.join(directory, "index.js"), "utf8") }
    } else {
      const location = Code.fromAsset(directory).bind(this).s3Location
      if (!location) {
        throw new Error(
          "CDK auto-delete handler asset did not provide an S3 code location"
        )
      }
      code = { S3Bucket: location.bucketName, S3Key: location.objectKey }
    }
    // CustomResourceProviderBase uses this child ID for its Lambda resource.
    const handler = new CfnResource(this, "Handler", {
      type: "AWS::Lambda::Function",
      properties: {
        Code: code,
        Handler: "index.handler",
        Role: role.roleArn,
        Runtime: determineLatestNodeRuntimeName(this),
        Timeout: 900,
        MemorySize: 128,
      },
    })
    this.token = handler.getAtt("Arn").toString()
    // The bucket policy supplies the S3 permissions. Keep them there, just as
    // CDK does, to avoid a provider-policy/bucket-policy dependency cycle.
    const grant = grantLogging(role)
    if (grant.policyDependable) handler.node.addDependency(grant.policyDependable)
  }

  public get serviceToken(): string {
    // CDK's bucket consumes the singleton through this property (no bind API).
    // Recording the read lets assertBound reject changed singleton lookup paths.
    this.bound = true
    return this.token
  }

  public assertBound(): void {
    if (!this.bound) {
      throw new Error(
        "Unsupported CDK auto-delete singleton layout: the bucket did not reuse " +
          "the supplied-role provider. Refusing to synthesize a changed service token."
      )
    }
  }
}
