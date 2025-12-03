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
npm install esbuild @opennextjs/aws cdk-opennext
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

You can customize the Lambda function configuration using `defaultFunctionProps`:

```typescript
import { NextjsSite } from "cdk-opennext"
import { Duration } from "aws-cdk-lib/core"

const site = new NextjsSite(this, "NextjsSite", {
  openNextPath: ".open-next",
  defaultFunctionProps: {
    memorySize: 2048,
    timeout: Duration.seconds(30),
    environment: {
      MY_ENV_VAR: "value",
    },
  },
})
```

# How it works

This package assumes that the Next and OpenNext build are done outside
of this construct. Therefore this package does not pull in the
`@opennextjs/aws` package, but it should be a dependency of your package.

# SST v2 compatibility

Switching to this construct is a fairly major update. All functions will be replaced.

Not yet implemented functionality:

- [ ] Warmer function
- [ ] Many improvements could be made

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
