import { existsSync } from "fs"
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam"
import { Stack } from "aws-cdk-lib/core"
import { SuppliedRoleBucketAutoDeleteProvider } from "../src/bucket-auto-delete-provider"

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(jest.requireActual("fs").existsSync),
}))

describe("CDK auto-delete compatibility guards", () => {
  it("fails clearly if CDK moves or omits its bundled handler", () => {
    const stack = new Stack()
    const role = new Role(stack, "Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    })
    jest.mocked(existsSync).mockReturnValueOnce(false)
    expect(() => SuppliedRoleBucketAutoDeleteProvider.prepare(stack, role)).toThrow(
      /Unsupported CDK auto-delete handler layout/
    )
  })

  it("refuses an unused shim instead of permitting a changed service token", () => {
    const stack = new Stack()
    const role = new Role(stack, "Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    })
    SuppliedRoleBucketAutoDeleteProvider.prepare(stack, role)
    const provider = stack.node.findChild(
      "Custom::S3AutoDeleteObjectsCustomResourceProvider"
    ) as SuppliedRoleBucketAutoDeleteProvider
    expect(() => provider.assertBound()).toThrow(/did not reuse/)
    expect(provider.serviceToken).toBeDefined()
    expect(() => provider.assertBound()).not.toThrow()
  })
})
