import { Asset } from "aws-cdk-lib/aws-s3-assets"
import { ISource } from "aws-cdk-lib/aws-s3-deployment"

/**
 * Source.asset currently grants reads on the whole bootstrap bucket. Keep its
 * AssetN construct identity but grant reads only on the archive we deploy.
 * Template/manifest comparisons and latest-CDK CI guard this compatibility shim.
 * @internal
 */
export function scopedAssetSource(assetPath: string): ISource {
  return {
    bind: (scope, context) => {
      if (!context) throw new Error("BucketDeployment source context is required")
      let index = 1
      while (scope.node.tryFindChild(`Asset${index}`)) index++
      const asset = new Asset(scope, `Asset${index}`, { path: assetPath })
      if (!asset.isZipArchive) {
        throw new Error("BucketDeployment assets must be directories or zip archives")
      }
      asset.bucket.grantRead(context.handlerRole, asset.s3ObjectKey)
      return { bucket: asset.bucket, zipObjectKey: asset.s3ObjectKey }
    },
  }
}
