# The documentation site

The Nuxt app behind the docs, the landing page and the playground.

It deploys to Vercel. The `vercel.json` next to this file is its whole configuration, because the
Vercel project's **Root Directory** is set to `website`.

## Why `buildCommand` isn't just `nuxt build`

The site depends on `nuxt-convex-module` and loads it as a Nuxt module. pnpm links the repository
root into `node_modules`, but that link points at a package whose `dist/` is gitignored. On a fresh
clone the build dies before rendering anything:

```
[warn]  The module `nuxt-convex-module` could not be loaded.
[error] Cannot resolve module "nuxt-convex-module"
```

So the build command is `pnpm --dir .. run dev:prepare:lib && pnpm --dir .. run build`, and it
needs both halves:

- `dev:prepare:lib` generates the repository root's `.nuxt/tsconfig.json`. Without it
  `nuxt-module-build` can't resolve compiler options and fails with
  `TSConfckParseError: failed to resolve "extends":"./.nuxt/tsconfig.json"`. `release.yml`'s build
  job runs the same step before `pnpm pack`, for the same reason.
- `build` then replaces the stub with a real build. The stub symlinks `dist/runtime` at `src/`,
  which is fine for development but not for a production deploy.

Verified from a clean state: `rm -rf .nuxt dist`, then the command above.

`vercel.json` has no comments in it because Vercel's schema rejects unknown properties, including
`$comment`. That's what this file is for.

## Settings that live in Vercel, not here

| Setting | Value | Why |
| --- | --- | --- |
| Root Directory | `website` | The app isn't at the repository root |
| Include source files outside the Root Directory | **on** | The module is imported from the repo root |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Uses the `packageManager` pin instead of Vercel's own pnpm |
| Production env | `CONVEX_DEPLOY_KEY`, `NUXT_PUBLIC_CONVEX_SITE_URL` | The live deployment's Convex project |
| Preview env | **nothing Convex-related** | See below |
| Deployment Protection → Vercel Authentication | **off** | A preview nobody can open isn't a preview. Vercel's scopes are *all*, *previews only*, or *production URLs + previews* — there is no "production only" — so keeping previews open means turning it off. Only the `*.vercel.app` URLs become public; the production domain was already exempt, and this is a public docs site |

## The two previews on a pull request

Each PR gets two, and they answer different questions.

| Preview | What it shows | Convex |
| --- | --- | --- |
| **Vercel** — `nuxt-convex-module-git-<branch>-razum.vercel.app` | The website as that branch would ship it: docs, landing, API reference | none — the embedded playground renders its offline state |
| **StackBlitz** — from the pkg.pr.new comment | `examples/playground`, a real Nuxt app running the PR's *package build* | **yours** — you supply a deployment URL |

To test a pull request's package you bring your own Convex credentials. Nothing enforces that by
convention — it's enforced by absence. No `CONVEX_DEPLOY_KEY` exists in any preview environment,
and nothing in CI or in this build ever runs `convex deploy`, so a preview branch can't create a
Convex deployment even if something later tried to.

## Running it locally

```sh
pnpm dev          # from the repository root — convex dev + nuxt dev
```

`nuxt build` here prints "Build complete!" and then never exits. That's a known quirk of this app's
module graph, not a hang. It's why `ci` type-checks the site and leaves the production build to
Vercel.
