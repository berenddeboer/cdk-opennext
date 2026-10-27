// Run from the repository root; pass the unpacked published package directory.
const fs = require("fs")
const os = require("os")
const path = require("path")
const ts = require("typescript")
const { Stack } = require("aws-cdk-lib")
const { Template } = require("aws-cdk-lib/assertions")
const { NextjsSite } = require(path.resolve(process.argv[2], "lib/open-next.js"))

// Use exactly the fixture that the migration test extends (no source duplication).
const source = fs.readFileSync("test/open-next.test.ts", "utf8")
const start = source.indexOf("const mockOpenNextOutput =")
const end = source.indexOf("const dummyHandler =")
if (start < 0 || end <= start) throw new Error("Cannot find the test fixture definition")
const output = new Function(
  ts.transpile(source.slice(start, end)) + ";return mockOpenNextOutput"
)()
output.origins.additional = { ...output.origins.default }
output.additionalProps.warmer = { handler: "index.handler", bundle: "server-function" }
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "cdk-opennext-070-"))
try {
  for (const bundle of ["assets", "server-function", "image-optimization-function",
    "revalidation-function", ".open-next/dynamodb-provider"]) {
    fs.mkdirSync(path.join(fixture, bundle), { recursive: true })
    fs.writeFileSync(path.join(fixture, bundle, "index.js"), "exports.handler = async () => ({})")
  }
  fs.writeFileSync(path.join(fixture, ".open-next/open-next.output.json"), JSON.stringify(output))
  const stack = new Stack(undefined, "MigrationStack", {
    env: { account: "123456789012", region: "us-east-1" },
  })
  new NextjsSite(stack, "TestOpenNext", { openNextPath: path.join(fixture, ".open-next") })
  const resources = Object.entries(Template.fromStack(stack).toJSON().Resources)
  const baseline = {
    stateful: resources.filter(([, value]) => [
      "AWS::S3::Bucket", "AWS::DynamoDB::GlobalTable", "AWS::SQS::Queue",
    ].includes(value.Type)).map(([id]) => id),
    tokens: Object.fromEntries(resources.filter(([, value]) => value.Properties?.ServiceToken)
      .map(([id, value]) => [id, value.Properties.ServiceToken])),
    providerFunctions: resources.filter(([id, value]) => value.Type === "AWS::Lambda::Function" &&
      /Provider|BucketDeployment/.test(id)).map(([id]) => id),
  }
  process.stdout.write(JSON.stringify(baseline, null, 2) + "\n")
} finally {
  fs.rmSync(fixture, { recursive: true, force: true })
}
