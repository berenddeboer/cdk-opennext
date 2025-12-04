import { awscdk, javascript } from "projen"
import { TrailingComma } from "projen/lib/javascript"
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Berend de Boer",
  authorAddress: "berend@pobox.com",
  constructsVersion: "10.4.3",
  cdkVersion: "2.231.0",
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
  repositoryUrl: "https://github.com/berenddeboer/cdk-opennext.git",

  workflowNodeVersion: "24.x",
  npmTrustedPublishing: true,

  // deps: [],                /* Runtime dependencies of this module. */
  description: "AWS CDK construct for deploying Next.js applications with OpenNext",
  devDeps: ["husky@^9", "@commitlint/cli@^19", "@commitlint/config-conventional@^19"],
  // packageName: undefined,  /* The "name" in package.json. */

  keywords: ["aws", "aws-cdk", "opennext", "open-next", "nextjs", "Next.js"],

  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: ["feat", "fix", "chore", "ci", "vendor"],
      },
    },
  },
})

// Add npm scripts for husky and commitlint
project.addScripts({
  prepare: "husky",
})

// Add commitlint configuration
project.addFields({
  commitlint: {
    extends: ["@commitlint/config-conventional"],
  },
})

project.synth()
