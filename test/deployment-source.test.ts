import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam"
import { Stack } from "aws-cdk-lib/core"
import { scopedAssetSource } from "../src/deployment-source"

describe("scoped deployment sources", () => {
  it("rejects a missing binding context before creating an asset", () => {
    const stack = new Stack()
    expect(() => scopedAssetSource("/not-an-asset").bind(stack)).toThrow(
      /context is required/
    )
    expect(stack.node.children).toHaveLength(0)
  })

  it("retains Source.asset's directory-or-archive restriction", () => {
    const stack = new Stack()
    const role = new Role(stack, "Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    })
    expect(() =>
      scopedAssetSource(__filename).bind(stack, { handlerRole: role })
    ).toThrow(/directories or zip archives/)
  })
})
