import { awscdk, javascript } from "projen"
import { TrailingComma } from "projen/lib/javascript"
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Berend de Boer",
  authorAddress: "berend@pobox.com",
  constructsVersion: "10.3.0",
  cdkVersion: "2.201.0",
  defaultReleaseBranch: "main",
  jsiiVersion: "~5.9.0",
  name: "cdk-opennext",
  packageManager: javascript.NodePackageManager.NPM,
  prettier: true,
  prettierOptions: {
    settings: {
      trailingComma: TrailingComma.ES5,
      semi: false,
      singleQuote: false,
      printWidth: 90,
    },
    yaml: true,
  },
  projenrcTs: true,
  repositoryUrl: "https://github.com/berend/cdk-opennext.git",

  // deps: [],                /* Runtime dependencies of this module. */
  description: "AWS CDK construct for deploying Next.js applications with OpenNext",
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
})
project.synth()
