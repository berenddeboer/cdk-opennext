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
      packages: ["@swc/helpers@0.5.17", "styled-jsx@5.1.6", "@next/env@16.0.7", "semver", "pg"],
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

## Not Yet Implemented

**Core Functions:**
- [ ] Lambda@Edge deployment - Cannot deploy server to edge for lower latency
- [ ] Middleware as edge functions - Middleware may not execute optimally

**CloudFront:**
- [ ] Advanced cache key generation - Current implementation uses basic x-forwarded-host only
- [ ] Geo-location header injection - No CloudFront geo-headers passed to Lambda
- [ ] Custom server cache policy configuration - Cache policy is hard-coded

**Lambda Configuration:**
- [ ] Image optimization configuration - No memorySize or staticImageOptimization options
- [ ] VPC support for revalidation function
- [ ] Custom runtime configuration - Defaults to Node.js 24.x
- [ ] Dynamic memory allocation for initialization function - Fixed at 128 MB

**Debugging:**
- [ ] Sourcemap handling - Less detailed error reporting compared to SST v2

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
