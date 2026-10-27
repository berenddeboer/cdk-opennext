import { readFileSync } from "fs"
import { createRequire } from "module"
import * as path from "path"
import { runInNewContext } from "vm"

describe("supplied-role bucket deletion handler", () => {
  const load = () => {
    const s3 = {
      getBucketTagging: jest.fn().mockResolvedValue({
        TagSet: [{ Key: "aws-cdk:auto-delete-objects", Value: "true" }],
      }),
      getBucketPolicy: jest.fn().mockResolvedValue({ Policy: '{"Statement":[]}' }),
      putBucketPolicy: jest.fn().mockResolvedValue({}),
      listObjectVersions: jest.fn().mockResolvedValue({
        Versions: [{ Key: "asset", VersionId: "version" }],
        DeleteMarkers: [{ Key: "old", VersionId: "marker" }],
      }),
      deleteObjects: jest.fn().mockResolvedValue({}),
    }
    const module = {
      exports: {} as {
        autoDeleteHandler: (event: Record<string, unknown>) => Promise<unknown>
      },
    }
    const requireModule = createRequire(__filename)
    const directory = path.join(
      path.dirname(require.resolve("aws-cdk-lib/package.json")),
      "custom-resource-handlers/dist/aws-s3/auto-delete-objects-handler"
    )
    // Execute the actual bundled CDK code used by our provider, not a copy.
    runInNewContext(readFileSync(path.join(directory, "index.js"), "utf8"), {
      module,
      require: (id: string) =>
        id === "@aws-sdk/client-s3"
          ? {
              S3: class {
                constructor() {
                  return s3
                }
              },
            }
          : requireModule(id),
      console: { log: jest.fn() },
    })
    return { s3, handler: module.exports.autoDeleteHandler }
  }

  it("does not delete objects during Create or role-only Update", async () => {
    const { s3, handler } = load()
    const properties = { BucketName: "existing-bucket" }
    await handler({ RequestType: "Create", ResourceProperties: properties })
    await handler({
      RequestType: "Update",
      ResourceProperties: properties,
      OldResourceProperties: properties,
      PhysicalResourceId: "existing-bucket",
    })
    for (const operation of Object.values(s3)) expect(operation).not.toHaveBeenCalled()
  })

  it("preserves tagged bucket cleanup, including versions and delete markers", async () => {
    const { s3, handler } = load()
    await handler({ RequestType: "Delete", ResourceProperties: { BucketName: "bucket" } })
    expect(s3.putBucketPolicy).toHaveBeenCalledWith({
      Bucket: "bucket",
      Policy: expect.stringContaining('"Deny"'),
    })
    expect(s3.deleteObjects).toHaveBeenCalledWith({
      Bucket: "bucket",
      Delete: {
        Objects: [
          { Key: "asset", VersionId: "version" },
          { Key: "old", VersionId: "marker" },
        ],
      },
    })
  })

  it("refuses to empty a bucket without the auto-delete tag", async () => {
    const { s3, handler } = load()
    s3.getBucketTagging.mockResolvedValue({ TagSet: [] })
    await handler({ RequestType: "Delete", ResourceProperties: { BucketName: "bucket" } })
    expect(s3.deleteObjects).not.toHaveBeenCalled()
    expect(s3.putBucketPolicy).not.toHaveBeenCalled()
  })
})
