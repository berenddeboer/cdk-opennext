# Agent Guidelines for cdk-opennext

CDK construct to deploy a Next.js 15+ application to AWS using the OpenNext AWS adapter. Optimised for use with the Nx monorepo tool

## Build & Test Commands

- `npm test` - Run all tests with coverage
- `npx jest test/open-next.test.ts` - Run a single test file
- `npm run build` - Build the project
- `npm run eslint` - Run linter

## Code Style

- **Formatting**: No semicolons, double quotes, 90 char line width, ES5 trailing commas
- **Imports**: Group builtin/external, alphabetize ascending, no duplicates
- **Types**: Strict TypeScript - no implicit any, unused vars, or floating promises
- **Naming**: PascalCase for classes/interfaces, camelCase for variables/methods
- **Member Order**: Static fields/methods → instance fields → constructor → methods
- **Error Handling**: Always await promises, use `@typescript-eslint/return-await`

## Commits

- Use conventional commits: `type(scope): description`
- Types: feat, fix, docs, refactor, test, chore
- Breaking changes: Add `!` after type and `BREAKING CHANGE:` footer
- Max line length: 100 characters

## Project Notes

- Managed by Projen - edit `.projenrc.ts` then run `npx projen` to regenerate config
- Main export: `NextjsSite` construct (renamed from OpenNextCdk for SST v2 compatibility)
