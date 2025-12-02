import { awscdk, javascript } from "projen";
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Berend de Boer",
  authorAddress: "berend@pobox.com",
  cdkVersion: "2.1.0",
  defaultReleaseBranch: "main",
  jsiiVersion: "~5.9.0",
  name: "cdk-opennext",
  packageManager: javascript.NodePackageManager.NPM,
  prettier: true,
  projenrcTs: true,
  repositoryUrl: "https://github.com/berend/cdk-opennext.git",

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();
