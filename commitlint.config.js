module.exports = {
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
}
