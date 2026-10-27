import {
  AddToPrincipalPolicyResult,
  IRole,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam"
import { Stack } from "aws-cdk-lib/core"
import { Construct, Dependable } from "constructs"

const loggingGrants = new WeakMap<IRole, AddToPrincipalPolicyResult>()

/** @internal */
export function sameRole(scope: Construct, first: IRole, second: IRole): boolean {
  const stack = Stack.of(scope)
  return (
    JSON.stringify(stack.resolve(first.roleArn)) ===
    JSON.stringify(stack.resolve(second.roleArn))
  )
}

/** @internal */
export function grantLogging(role: IRole): AddToPrincipalPolicyResult {
  const existing = loggingGrants.get(role)
  if (existing) return existing
  // ImmutableRole may report success while discarding the statement and
  // returning an empty DependencyGroup. Created Roles fill their group later.
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
  loggingGrants.set(role, grant)
  return grant
}
