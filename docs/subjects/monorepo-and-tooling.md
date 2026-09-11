# Monorepo & Tooling

## The setup

[Turborepo](https://turbo.build/repo/docs) for task orchestration +
[npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces) for
package linking (not pnpm or yarn — one fewer tool to install, and nothing
here needs pnpm's specific features). Two apps (`apps/web`, `apps/mobile`)
and three shared packages (`packages/api-client`, `packages/schemas`,
`packages/ui-tokens`) — see the [directory map](./README.md#directory-map)
in the index.

## Why a monorepo at all

The web app and the (eventually real) mobile app both need the same backend
DTO types, the same Zod validation rules, and the same brand tokens.
Publishing those as separate npm packages would mean a version-bump-and-
republish cycle for every small type change — friction with no benefit at
this stage. A monorepo with workspace-linked packages means editing
`packages/schemas` is immediately visible to `apps/web` with no publish
step, via a `file:`-style symlink npm workspaces sets up automatically.

This mirrors the backend's own reasoning for choosing a modular monolith
over microservices (`nawill-pay-frontend.md` doc 2 §1.1's cross-reference):
keep operational overhead low for a small team, preserve clean seams for
later if something needs to split out.

## Why Turborepo specifically

Turborepo's job is caching and parallelizing `npm run build`/`lint`/`typecheck`
across the workspace — it skips re-running a task whose inputs haven't
changed. `turbo.json` defines the task graph: `build` depends on `^build`
(build a package's dependencies first), `dev` is long-running and
uncached. In a two-app, three-package repo the benefit is modest today; it
matters more as the mobile app gains real code and the packages grow.

## Common commands

```bash
npm install                    # installs every workspace in one pass, from the repo root
npm run dev:web                 # apps/web's dev server only
npm run dev                     # everything, via `turbo run dev`
npm run build                   # turbo run build (currently just apps/web)
npm run typecheck               # turbo run typecheck
npm install <pkg> --workspace=web                    # add a dependency to one app
npm install <pkg> --workspace=@napayment/schemas      # add a dependency to one package
```

Full setup/run instructions: the root [`README.md`](../../README.md).

## Package boundaries — what belongs where

| If you're adding... | It belongs in... |
|---|---|
| A backend DTO type or endpoint function | `packages/api-client` |
| A form validation rule | `packages/schemas` |
| A brand color, spacing value | `packages/ui-tokens` |
| A React component, hook, page, or anything with a Next.js/React Native import | The relevant `apps/*` |

The rule of thumb: **a package has no framework dependency** (no `next`, no
`react-native`, and — today — no `react` either, though that could change if
truly shared UI components get extracted, see `nawill-pay-frontend.md` doc
F8's note on `packages/ui-web` as a possible future split). If code needs
`"use client"` or a React Native import, it's app code, not package code.

## `transpilePackages`

`apps/web/next.config.ts` lists all three packages under
`transpilePackages`. This tells Next.js to run its own compiler over their
TypeScript source directly, rather than expecting pre-built JS —
`packages/*` ship raw `.ts` with no build step of their own (their
`package.json`'s `main`/`types` point straight at `src/index.ts`). This is a
deliberate simplification: no package needs its own `tsup`/`rollup` build
pipeline as long as the only consumer (`apps/web`) can transpile it
directly. `apps/mobile` will need the equivalent wiring in `metro.config.js`
once it actually imports these packages (see
[`mobile-app.md`](./mobile-app.md) — not done yet).

## Git workflow

`dev` is the default branch; `main` tracks releases. Branch naming and the
Conventional Commits convention are documented in the root README's
"Git workflow & branching" section — same convention as the backend repo, so
contributors moving between the two don't context-switch styles.

## Further reading

- [Turborepo docs](https://turbo.build/repo/docs)
- [npm workspaces docs](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Conventional Commits](https://www.conventionalcommits.org/)
- `nawill-pay-frontend.md` doc F8 ("Repository Layout, Naming & Design Tokens")
