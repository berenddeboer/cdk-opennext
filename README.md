# About

CDK construct to deploy a NextJs 15 or higher application using the
[OpenNext AWS adapter](https://github.com/opennextjs/opennextjs-aws).

It works best if [deployed in an Nx
monorepo](https://opennext.js.org/aws/config/nx).

This OpenNext CDK construct is based on [the reference
construct](https://opennext.js.org/aws/reference-implementation)
provided by OpenNext. The example has been modernised, and the deploy
to ECS option has been removed.

# Usage

Requires `aws-cdk-lib` >=2.274.0 <3 and `constructs` >=10.8.1 <11.
When upgrading from an earlier release, upgrade these peer dependencies as well.

1. Install:

```sh
npm install --save-dev esbuild @opennextjs/aws cdk-opennext
```

2. Build your app: `npx next build`

3. Build with open-next: `npx open-next build`

4. Add the `NextjsSite` construct:

```typescript
import { NextjsSite } from "cdk-opennext"

const site = new NextjsSite(this, "NextjsSite", {
  openNextPath: ".open-next",
})
```

`openNextPath` is optional and defaults to ".open-next".

You can customize the Lambda function configuration using `defaultFunctionProps`:

```typescript
import { NextjsSite } from "cdk-opennext"
import { Duration } from "aws-cdk-lib/core"

const site = new NextjsSite(this, "NextjsSite", {
  defaultFunctionProps: {
    memorySize: 2048,
    timeout: Duration.seconds(30),
    environment: {
      MY_ENV_VAR: "value",
    },
  },
})
```

### Shared execution role

Set `defaultFunctionProps.role` to reuse an existing Lambda execution role across
the default server, additional server origins, image optimizer, revalidation,
initialization, warmer, pre-warmer, custom-resource providers, S3 deployments,
bucket auto-delete, and DNS certificate helpers. No site-generated IAM roles
remain anywhere in the stack:

```typescript
const site = new NextjsSite(this, "NextjsSite", {
  defaultFunctionProps: {
    role: executionRole,
  },
})
```

The role must trust `lambda.amazonaws.com`. The construct grants the required
permissions to the shared role, so all functions using it share the combined
permissions. A usable policy attachment path is required; immutable imported
roles (including `withoutPolicyUpdates()`) are rejected rather than silently
discarding grants. The deployment principal must be able to attach the policies
and pass the role. Without a supplied role, existing generated-role behavior remains.
Logging grants include `logs:CreateLogGroup`, `logs:CreateLogStream`, and
`logs:PutLogEvents` on `*`, matching CDK's helper behavior. A shared role gives
every function these logging permissions as well as the combined site grants.
In particular, the image optimizer, warmer, pre-warmer, and provider functions
inherit the server's S3, DynamoDB, and SQS permissions through this shared role.
Source-asset reads are scoped to the deployed archives; auto-delete permissions
remain in each bucket's resource policy. Other `defaultFunctionProps` settings
apply only to the default server. An explicit per-function role takes precedence
where a function-role input is supported; there are currently no separate public
image optimizer, warmer, or helper-role inputs.
The existing `defaultFunctionProps.logRetentionRole` override takes precedence
for the deprecated `logRetention` helper; otherwise that helper uses the shared
role too. Its stack singleton must also have a compatible role.
With a shared role, site functions receive deterministic names to avoid
CloudFormation dependency cycles. This can replace existing unnamed functions
when upgrading; an explicit `defaultFunctionProps.functionName` is preserved.
Later changes that require replacing an explicitly named function may need a new
name or a staged migration; review the CloudFormation change set before deploying.

S3 helpers are **stack-level singletons**. All `NextjsSite` instances in a stack
must share the same supplied role, or all omit it. Mixed or distinct-role sites,
and a pre-existing incompatible S3 helper, fail at construction rather than
silently retaining or changing another site's identity. Unrelated CDK bucket
deployments must use the same role when sharing the deployment singleton.
Create sites before unrelated auto-delete buckets so they reuse the configured
provider; those buckets also use the supplied role and retain their own bucket
policy grants. This integration does not reconfigure previously created helpers
or helpers in other stacks. CDK's bundled auto-delete handler and singleton paths
are an encapsulated compatibility integration, covered by template/handler tests.
CI tests the pinned minimum and the latest published CDK 2.x. Missing bundled
handler assets or failure to reuse the expected singleton are explicit errors,
not permission to synthesize a different deletion provider. Keep `aws-cdk-lib`
external when bundling infrastructure code so its handler assets remain available.
The latest-CDK job also runs weekly to detect upstream changes between PRs.
Within a stack, prefer reusing the same `IRole` object. Compatibility checks
compare resolved ARN expressions; differently tokenized imports of the same
physical role can be rejected rather than guessed equivalent.

For a stable role used by multiple stacks, import it separately into each stack
with **distinct policy ownership names**:

```typescript
const executionRole = iam.Role.fromRoleArn(this, "ExecutionRole", roleArn, {
  mutable: true,
  defaultPolicyName: "FrontendBlueSitePermissions", // different in every owning stack
})
```

Do not import the same role multiple times with conflicting policy ownership.
Each stack attaches and deletes only its own inline policy; the caller owns the
external role's lifecycle. Avoid exporting a site-owned role from a disposable
stack. The minimum supported CDK peer is **2.274.0** (`^2.274.0`, unchanged from
0.7.0); a consumer resolving 2.273.0 must update its CDK dependency/lockfile.

#### Migration from 0.7.0

Adding a supplied role removes the old IAM role resources from the template;
CloudFormation deletes them instead of retaining unused declarations. Bucket,
table, queue and custom-resource logical IDs, service tokens, and provider Lambda
identities are preserved. The auto-delete provider changes its execution role
in place, using CDK's existing handler and tag/deletion safeguards. A role-only
update does not request bucket cleanup. Asset deployments still use `prune: false`;
actual site deletion still empties its tagged bucket and destroys its table.

Keep stack/site construct paths unchanged. Inspect the change set: there must
be no bucket/table/queue replacement, provider replacement, or custom-resource
service-token change. Ordinary runtime functions may be replaced as noted above.
Back up state before migration and retain the external role and permissions
through rollback/deletion. Tests compare identities captured from the published
0.7.0 package and exercise the actual deletion handler with mocked AWS calls;
they do **not** establish live migration safety. No credentialed deployment,
rollback, or deletion round-trip has been performed for this change.

## Lambda Warming

By default, Lambda warming is enabled to prevent cold starts. The construct keeps 1 server instance warm with 5-minute intervals.

### Default Behavior

```typescript
import { NextjsSite } from "cdk-opennext"

const site = new NextjsSite(this, "NextjsSite", {
  // Warming is enabled by default with warm: 1
})
```

### Customize Warming

```typescript
import { NextjsSite } from "cdk-opennext"
import { Duration } from "aws-cdk-lib/core"

const site = new NextjsSite(this, "NextjsSite", {
  warm: 5, // Keep 5 concurrent instances warm
  warmerInterval: Duration.minutes(10), // Warm every 10 minutes
  prewarmOnDeploy: false, // Disable pre-warming on deployment
})
```

### Disable Warming

```typescript
const site = new NextjsSite(this, "NextjsSite", {
  warm: false, // Disable warming
})
```

### How It Works

- A dedicated warmer Lambda function (provided by OpenNext) periodically invokes your server functions
- Creates concurrent invocations to keep multiple instances warm
- EventBridge rule triggers the warmer at the specified interval
- Optional pre-warming invokes the warmer immediately after deployment
- Environment variable `WARMER_ENABLED=true` is set when warming is configured

**Note**: Warming requires OpenNext 3.x+ with warmer support. If OpenNext doesn't provide a warmer bundle, warming will be skipped with a warning.

## Revalidation Options

This construct follows the OpenNext build output in `.open-next/open-next.output.json`.
Configure revalidation behavior in `open-next.config.ts` and `NextjsSite` will only
create the required resources.

By default, OpenNext uses an SQS FIFO queue and a dedicated revalidation Lambda.

### Low-volume revalidation without SQS

If your app rarely invalidates pages, use OpenNext's built-in `direct` queue mode.
This skips the SQS queue and revalidation consumer Lambda entirely.

```typescript
import type { OpenNextConfig } from "@opennextjs/aws/types/open-next"

const config = {
  default: {
    override: {
      queue: "direct",
    },
  },
} satisfies OpenNextConfig

export default config
```

### Disable tag invalidation

Disable the tag cache if you do not use `revalidateTag` or `revalidatePath`.
When disabled, the construct will not create the DynamoDB tag cache table or the
initialization Lambda.

```typescript
import type { OpenNextConfig } from "@opennextjs/aws/types/open-next"

const config = {
  dangerous: {
    disableTagCache: true,
  },
} satisfies OpenNextConfig

export default config
```

This is generally only safe when you do not rely on App Router tag or path
invalidations. It is most useful for Pages Router applications.

### Disable incremental cache

Disable the incremental cache only for SSR-only applications. When disabled,
the construct will not create the revalidation queue, revalidation Lambda, or
tag cache resources.

```typescript
import type { OpenNextConfig } from "@opennextjs/aws/types/open-next"

const config = {
  dangerous: {
    disableIncrementalCache: true,
  },
} satisfies OpenNextConfig

export default config
```

With incremental cache disabled, ISR, SSG, `revalidateTag`, and `revalidatePath`
will not work.

## Custom Domain

You can configure a custom domain in three ways:

### Option 1: Route 53 Hosted Zone (automatic certificate and DNS)

Provide a hosted zone and the construct will automatically create a DNS-validated
certificate and set up A/AAAA records:

```typescript
import { NextjsSite } from "cdk-opennext"
import { HostedZone } from "aws-cdk-lib/aws-route53"

const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
  domainName: "example.com",
})

const site = new NextjsSite(this, "NextjsSite", {
  customDomain: {
    domainName: "app.example.com",
    hostedZone: hostedZone,
  },
})
```

### Option 2: Bring Your Own Certificate (external DNS)

Provide your own ACM certificate when DNS is managed externally. The certificate
must be in us-east-1 for CloudFront:

```typescript
import { NextjsSite } from "cdk-opennext"
import { Certificate } from "aws-cdk-lib/aws-certificatemanager"

const certificate = Certificate.fromCertificateArn(
  this,
  "Certificate",
  "arn:aws:acm:us-east-1:123456789012:certificate/..."
)

const site = new NextjsSite(this, "NextjsSite", {
  customDomain: {
    domainName: "app.example.com",
    certificate: certificate,
  },
})
// Configure your DNS provider to point app.example.com to site.distribution.distributionDomainName
```

### Option 3: Bring Your Own Certificate with Route 53 DNS

Provide both a certificate and hosted zone to use your own certificate while
still having the construct manage DNS records:

```typescript
import { NextjsSite } from "cdk-opennext"
import { Certificate } from "aws-cdk-lib/aws-certificatemanager"
import { HostedZone } from "aws-cdk-lib/aws-route53"

const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
  domainName: "example.com",
})

const certificate = Certificate.fromCertificateArn(
  this,
  "Certificate",
  "arn:aws:acm:us-east-1:123456789012:certificate/..."
)

const site = new NextjsSite(this, "NextjsSite", {
  customDomain: {
    domainName: "app.example.com",
    hostedZone: hostedZone,
    certificate: certificate,
  },
})
```

# How it works

This package assumes that the Next and OpenNext build are done outside
of this construct. Therefore this package does not pull in the
`@opennextjs/aws` package, but it should be a dependency of your package.

Obviously you don't wantt to build this manually all the time, that's
where Nx comes in.

## Use with Nx

Configuring Nx is also covered in [the OpenNext documentation](https://opennext.js.org/aws/config/nx).

In your Nx `project.json` add a "build" target to build next:

```json
"build": {
  "options": {
    "command": "next build"
  },
  "inputs": [
    "default",
    "^production",
    "!{projectRoot}/.next",
    "!{projectRoot}/.open-next",
    "!{projectRoot}/open-next.config.ts",
    "!{projectRoot}/cdk.json",
    "!{projectRoot}/cdk.context.json"
  ],
  "outputs": ["{projectRoot}/.next"]
},
```

If you enable caching, it will only build when your NextJs app has actually changed.

Then add a target to build OpenNext:

```json
"build-open-next": {
  "executor": "nx:run-commands",
  "dependsOn": ["build"],
  "cache": true,
  "inputs": ["{projectRoot}/open-next.config.ts", "{projectRoot}/.next"],
  "outputs": ["{projectRoot}/.open-next"],
  "options": {
    "cwd": "{projectRoot}",
    "command": "open-next build"
  }
},
```

And finally for your cdk deploy target, depend on the open next build:

```json
"deploy": {
  "dependsOn": ["build-open-next"]
}
```

Set the output to standalone in `next.config.ts`, this is key:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  ...
}
```

Your `open-next.config.ts` can look like this:

```ts
import type { OpenNextConfig } from "@opennextjs/aws/types/open-next"

const config = {
  default: {
    install: {
      packages: [
        "@swc/helpers@0.5.17",
        "styled-jsx@5.1.6",
        "@next/env@16.0.7",
        "semver",
        "pg",
      ],
      arch: "arm64",
    },
  },
  buildCommand: "exit 0", // Nx builds Next for us
  packageJsonPath: "../../", // Root directory of monorepo
} satisfies OpenNextConfig

export default config
```

The packages to install depend on your particular config. If you don't
use postgres for example, remove "pg".

# SST v2 compatibility

Switching to this construct from SST v2 is a fairly major update. All Lambda functions will be replaced.

## Compatible Features

- [x] Custom domains with Route 53 or external DNS
- [x] Automatic certificate creation and DNS records
- [x] S3 asset storage with Origin Access Control
- [x] CloudFront distribution with custom behaviors
- [x] Lambda server functions with streaming support
- [x] Image optimization function
- [x] Incremental Static Regeneration (ISR)
- [x] Revalidation queue and DynamoDB table
- [x] Multiple origins support
- [x] Custom Lambda function configuration via `defaultFunctionProps`
- [x] ARM64 architecture support
- [x] Lambda warming to prevent cold starts (enabled by default)
- [x] Image optimizer function protected by Origin Access Control (see [Known Issues](#known-issues))

## Not Yet Implemented

**Core Functions:**

- [ ] Lambda@Edge deployment - Cannot deploy server to edge for lower latency
- [ ] Middleware as edge functions - Middleware may not execute optimally
- [ ] Protect default server function URL so it cannot be accessed directly

**CloudFront:**

- [ ] Advanced cache key generation - Current implementation uses basic x-forwarded-host only
- [x] Geo-location header injection - CloudFront geo-headers passed to Lambda
- [ ] Custom server cache policy configuration - Cache policy is hard-coded

**Lambda Configuration:**

- [ ] Image optimization configuration - No memorySize or staticImageOptimization options
- [ ] VPC support for revalidation function
- [ ] Custom runtime configuration - Defaults to Node.js 24.x
- [ ] Dynamic memory allocation for initialization function - Fixed at 128 MB

**Debugging:**

- [ ] Sourcemap handling - Less detailed error reporting compared to SST v2

## Known Issues

### Image Optimizer OAC Missing Permission

The image optimizer function is protected by CloudFront Origin Access Control (OAC), which prevents direct access to the Lambda function URL. However, due to a [bug in AWS CDK](https://github.com/aws/aws-cdk/issues/35872), the generated Lambda resource-based policy is missing the required `lambda:InvokeFunction` permission.

AWS Lambda introduced **Dual Authentication** for Function URLs, which requires **both** permissions:

- `lambda:InvokeFunctionUrl`
- `lambda:InvokeFunction` (with `invokedViaFunctionUrl: true` condition)

The CDK currently only grants the first permission. A [fix has been submitted](https://github.com/aws/aws-cdk/pull/35919) and is awaiting maintainer review.

**Workaround:** Until the CDK fix is released, you can manually add the missing permission after deployment:

```bash
aws lambda add-permission \
  --statement-id "AllowCloudFrontServicePrincipalInvokeFunction" \
  --action "lambda:InvokeFunction" \
  --principal "cloudfront.amazonaws.com" \
  --source-arn "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>" \
  --function-name <IMAGE_OPTIMIZER_FUNCTION_NAME>
```

**Note:** AWS has a temporary exception period until November 1, 2026, during which the old single-permission model still works. After this date, the dual permission will be strictly enforced.

# Comparison to other implementations

- [SST v2](https://github.com/sst/v2): this is what I used in the
  past, but it's now community supported, PRs are being merged slowly,
  and it's getting very hard to integrate in modern monorepos.
- [cdk-nextjs-standalone](https://github.com/jetbridge/cdk-nextjs/):
  seems actively maintained, but README.md feels very dated. It's now
  also based on OpenNext but unclear how it tracks against OpenNext.
- [cdklabs/cdk-nextjs](https://github.com/cdklabs/cdk-nextjs): not
  based on the OpenNext adapter. Needs NAT gateway and EFS, so very
  expensive to run.
- [open-next-cdk](https://github.com/datasprayio/open-next-cdk): no
  longer maintained it seems
