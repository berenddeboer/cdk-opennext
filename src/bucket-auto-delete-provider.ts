import { readFileSync } from "fs"
import * as path from "path"
import { IRole, PolicyStatement, Role } from "aws-cdk-lib/aws-iam"
import { Code } from "aws-cdk-lib/aws-lambda"
import { CfnResource, determineLatestNodeRuntimeName, Stack } from "aws-cdk-lib/core"
import { Construct, Dependable } from "constructs"

/**
 * Adapter for CDK's stack singleton, which has no public execution-role input.
 * Keep the singleton and Handler paths identical to CDK's provider: changing
 * the service token can send a Delete to the old provider and empty the bucket.
 * The CDK handler (including its deletion safeguards) is deliberately reused.
 * Template compatibility is tested against the minimum supported CDK version.
 *
 * @internal
 */
export class SuppliedRoleBucketAutoDeleteProvider extends Construct {
  public static grantLogging(role: IRole) {
    // ImmutableRole can report statementAdded=true while returning an empty
    // DependencyGroup and discarding the statement. Check the attachment too.
    // Created Roles fill their dependency group later, during policy splitting.
    const grant = role.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        resources: ["*"],
      })
    )
    if (
      !grant.statementAdded ||
      !grant.policyDependable ||
      (!Role.isRole(role) &&
        Dependable.of(grant.policyDependable).dependencyRoots.length === 0)
    ) {
      throw new Error(
        "Supplied execution roles must allow policy attachments (mutable role)"
      )
    }
    return grant
  }

  public static prepare(scope: Construct, role?: IRole): void {
    const stack = Stack.of(scope)
    const id = "Custom::S3AutoDeleteObjectsCustomResourceProvider"
    const existing = stack.node.tryFindChild(id)
    if (role) {
      this.grantLogging(role)
    }
    if (existing) {
      if (
        role &&
        existing instanceof SuppliedRoleBucketAutoDeleteProvider &&
        JSON.stringify(stack.resolve(existing.roleArn)) ===
          JSON.stringify(stack.resolve(role.roleArn))
      ) {
        return
      }
      if (!role && !(existing instanceof SuppliedRoleBucketAutoDeleteProvider)) return
      throw new Error(
        "Incompatible S3 auto-delete singleton roles: all sites and auto-delete " +
          "buckets in a stack must use the same supplied role, or all use generated roles."
      )
    }
    if (role) new SuppliedRoleBucketAutoDeleteProvider(stack, id, role)
  }

  public readonly roleArn: string
  public readonly serviceToken: string

  constructor(scope: Construct, id: string, role: IRole) {
    super(scope, id)
    this.roleArn = role.roleArn
    const directory = path.join(
      path.dirname(require.resolve("aws-cdk-lib/package.json")),
      "custom-resource-handlers/dist/aws-s3/auto-delete-objects-handler"
    )
    const code = Code.fromAsset(directory).bind(this)
    const handler = new CfnResource(this, "Handler", {
      type: "AWS::Lambda::Function",
      properties: {
        Code: this.node.tryGetContext("@aws-cdk/core:inlineCustomResourceIfPossible")
          ? { ZipFile: readFileSync(path.join(directory, "index.js"), "utf8") }
          : {
              S3Bucket: code.s3Location!.bucketName,
              S3Key: code.s3Location!.objectKey,
            },
        Handler: "index.handler",
        Role: role.roleArn,
        Runtime: determineLatestNodeRuntimeName(this),
        Timeout: 900,
        MemorySize: 128,
      },
    })
    this.serviceToken = handler.getAtt("Arn").toString()
    // The bucket policy supplies the S3 permissions. Keep them there, just as
    // CDK does, to avoid a provider-policy/bucket-policy dependency cycle.
    const grant = SuppliedRoleBucketAutoDeleteProvider.grantLogging(role)
    if (grant.policyDependable) handler.node.addDependency(grant.policyDependable)
  }
}
