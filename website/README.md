# The documentation site

The Nuxt app behind the docs, the landing page and the playground. Deployed to
Vercel; `vercel.json` here is its whole configuration, because the project's
**Root Directory** is set to `website`.

## Why `buildCommand` is not just `nuxt build`

The site lists `nuxt-convex-module` as a workspace dependency and loads it as a
Nuxt module. pnpm links the repository root into `node_modules`, but that link
points at a package whose `dist/` is gitignored — so on a fresh clone the build
dies at module resolution before rendering a page:

```
[warn]  The module `nuxt-convex-module` could not be loaded.
[error] Cannot resolve module "nuxt-convex-module"
```

`pnpm --dir .. run dev:prepare:lib && pnpm --dir .. run build` is the fix, and
it needs both halves:

- `dev:prepare:lib` generates the repository root's `.nuxt/tsconfig.json`.
  Without it `nuxt-module-build` cannot resolve compiler options and dies with
  `TSConfckParseError: failed to resolve "extends":"./.nuxt/tsconfig.json"`.
  `release.yml`'s build job runs the same step before `pnpm pack`, for the same
  reason.
- `build` then replaces the stub with a real build. The stub symlinks
  `dist/runtime` at `src/`, which is a development shape; this is a production
  deploy.

Verified from a clean state — `rm -rf .nuxt dist`, then the command above.

`vercel.json` has no comments because Vercel's schema validation rejects
unknown properties outright — including `$comment`. Hence this file.

## Project settings that live in Vercel, not here

| Setting | Value | Why |
| --- | --- | --- |
| Root Directory | `website` | The app is not at the repository root |
| Include source files outside the Root Directory | **on** | The module is imported from the repo root |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Honours the `packageManager` pin instead of Vercel's own pnpm |
| Production env | `CONVEX_DEPLOY_KEY`, `NUXT_PUBLIC_CONVEX_SITE_URL` | The live deployment's Convex project |
| Preview env | **nothing Convex-related** | See below |
| Deployment Protection → Vercel Authentication | **off** | A preview nobody can open is not a preview. Vercel's scopes are *all*, *previews only*, or *production URLs + previews* — there is no "production only" — so leaving previews open means turning it off. Only the `*.vercel.app` URLs become public; the production domain was already exempt, and this is a public docs site |

## What each preview is for

A pull request produces two, and they answer different questions.

| Preview | What it shows | Convex |
| --- | --- | --- |
| **Vercel** — `nuxt-convex-module-git-<branch>-razum.vercel.app` | The website as that branch would ship it: docs, landing, API reference | none — the embedded playground renders its offline state |
| **StackBlitz** — from the pkg.pr.new comment | `examples/playground`, a real Nuxt app running the PR's *package build* | **yours** — the visitor supplies a deployment URL |

Testing a pull request's package therefore means bringing your own Convex
credentials. That is enforced by absence, not by convention: no
`CONVEX_DEPLOY_KEY` exists in any preview environment, and nothing in CI or in
this build ever calls `convex deploy` — so no preview branch can create a Convex
deployment even if something later tried to.

## Locally

```sh
pnpm dev          # from the repository root — convex dev + nuxt dev
```

`nuxt build` here prints "Build complete!" and then does not exit; that is a
known quirk of this app's module graph, not a hang. It is why `ci` type-checks
the site but leaves the production build to Vercel.
