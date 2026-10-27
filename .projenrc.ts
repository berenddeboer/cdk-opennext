import { awscdk, javascript, github } from "projen"
import { TrailingComma } from "projen/lib/javascript"
const project = new awscdk.AwsCdkConstructLibrary({
  author: "Berend de Boer",
  authorAddress: "berend@pobox.com",
  constructsVersion: "10.8.1",
  cdkVersion: "2.274.0",
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
  devDeps: [
    "husky@^9",
    "@commitlint/cli@^21.0.1",
    "@commitlint/config-conventional@^21.0.1",
  ],
  // packageName: undefined,  /* The "name" in package.json. */

  keywords: ["aws", "aws-cdk", "opennext", "open-next", "nextjs", "Next.js"],

  githubOptions: {
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: ["docs", "feat", "fix", "chore", "ci", "vendor"],
      },
    },
  },
  // Keep `npx projen upgrade` locally; disable the scheduled upgrade-main
  // workflow (GITHUB_TOKEN cannot push workflow file changes).
  depsUpgradeOptions: {
    workflow: false,
  },
})

// The default build tests the pinned minimum. Also exercise CDK's evolving
// singleton/handler internals against the latest published compatible major.
const cdkCompatibility = project.github?.addWorkflow("cdk-compatibility")
cdkCompatibility?.on({
  pullRequest: {},
  workflowDispatch: {},
  schedule: [{ cron: "17 6 * * 1" }],
})
cdkCompatibility?.addJob("latest-cdk", {
  runsOn: ["ubuntu-latest"],
  permissions: { contents: github.workflows.JobPermission.READ },
  steps: [
    { uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1" },
    {
      uses: "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020", // v7.0.0
      with: { "node-version": "24.x" },
    },
    { run: "npm ci" },
    {
      name: "Install latest CDK 2.x without changing the pinned minimum",
      run: "npm install --no-save --package-lock=false aws-cdk-lib@2",
    },
    {
      name: "Verify migration identities, singleton roles and deletion safeguards",
      run: "npx jest --runInBand",
    },
  ],
})

const dependabot = project.github?.addDependabot()
if (dependabot) {
  dependabot.config.updates = [
    {
      "package-ecosystem": "github-actions",
      directory: "/",
      "commit-message": {
        prefix: "chore(ci)",
      },
      schedule: {
        interval: github.DependabotScheduleInterval.WEEKLY,
      },
      allow: [
        { "dependency-name": "anthropics/claude-code-action" },
        { "dependency-name": "reviewdog/action-actionlint" },
      ],
    },
  ]
}

// Add npm scripts for husky and commitlint
project.addScripts({
  prepare: "husky",
})

// Add commitlint configuration
project.addFields({
  commitlint: {
    extends: ["@commitlint/config-conventional"],
    rules: {
      "type-enum": [
        2,
        "always",
        [
          "docs",
          "feat",
          "fix",
          "chore",
          "ci",
          "vendor",
          "build",
          "perf",
          "refactor",
          "revert",
          "style",
          "test",
        ],
      ],
    },
  },
})

// Keep generated shell scripts safe and free of actionlint/ShellCheck findings.
// Projen's build steps are lazily resolved, so use file overrides by index.
// Re-verify these step indices against the generated YAML after Projen upgrades.
const buildWorkflow = project.github?.tryFindWorkflow("build")
buildWorkflow?.file?.addOverride(
  "jobs.build.steps.4.run",
  [
    "git add .",
    'git diff --staged --patch --exit-code > repo.patch || echo "self_mutation_happened=true" >> "$GITHUB_OUTPUT"',
  ].join("\n")
)

const releaseWorkflow = project.github?.tryFindWorkflow("release")
releaseWorkflow?.file?.addOverride(
  "jobs.release.steps.5.run",
  [
    'TAG="$(cat dist/releasetag.txt)"',
    'if git ls-remote --exit-code origin "refs/tags/$TAG"; then',
    '  echo "exists=true" >> "$GITHUB_OUTPUT"',
    "else",
    '  echo "exists=false" >> "$GITHUB_OUTPUT"',
    "fi",
    'cat "$GITHUB_OUTPUT"',
  ].join("\n")
)
releaseWorkflow?.file?.addOverride(
  "jobs.release.steps.6.run",
  [
    'echo "latest_commit=$(git ls-remote origin -h "$GITHUB_REF" | cut -f1)" >> "$GITHUB_OUTPUT"',
    'cat "$GITHUB_OUTPUT"',
  ].join("\n")
)
releaseWorkflow?.file?.addOverride(
  "jobs.release_github.steps.3.run",
  [
    'tag=$(cat "$RELEASE_TAG_FILE")',
    'if ! gh release view "$tag" -R "$GITHUB_REPOSITORY" 2>/dev/null; then',
    '  gh release create "$tag" -R "$GITHUB_REPOSITORY" -F "$CHANGELOG_FILE" -t "$tag" --target "$GITHUB_SHA"',
    "fi",
  ].join("\n")
)

project.synth()
