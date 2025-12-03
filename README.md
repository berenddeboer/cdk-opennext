# About

CDK construct to deploy a NextJs 15 or higher application using the
[OpeNext adapter](https://github.com/opennextjs/opennextjs-aws).

It works best if [deployed in an Nx
monorepo](https://opennext.js.org/aws/config/nx).

This OpenNext CDK construct is based on [the reference
construct](https://opennext.js.org/aws/reference-implementation)
provided by OpenNext. The deploy to ECS option has been removed, and
the code updated.

# Comparison to other implementations

- SST v2: this is what I used in the past, but it's now community
  supported and getting very hard to integrate in modern monorepos.
- [cdk-nextjs-standalone](https://github.com/jetbridge/cdk-nextjs/):
  seems actively maintained, but README.md feels very dated. It's now
  also based on OpeNext but unclear how it tracks against OpeNext.
- [cdklabs/cdk-nextjs](https://github.com/cdklabs/cdk-nextjs): not
  based on the OpeNext adapter. Needs NAT gateway and EFS, so very
  expensive to run.
- [open-next-cdk](https://github.com/datasprayio/open-next-cdk): no
  longer maintained it seems
