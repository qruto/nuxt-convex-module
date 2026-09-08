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

`pnpm --dir .. run build` is the fix. The root `build` script rather than
`dev:prepare:lib`: the stub symlinks `dist/runtime` at `src/`, which is a
development shape, and this is a production deploy.

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

### Previews are bring-your-own-Convex

Preview deployments get no Convex environment variables at all. That is the
mechanism, not a convention: with no `CONVEX_DEPLOY_KEY` in the environment,
`convex deploy` *cannot* run on a preview even if something later tries to call
it. A preview is a playground where the visitor supplies their own deployment
URL — no preview branch ever creates a Convex deployment.

## Locally

```sh
pnpm dev          # from the repository root — convex dev + nuxt dev
```

`nuxt build` here prints "Build complete!" and then does not exit; that is a
known quirk of this app's module graph, not a hang. It is why `ci` type-checks
the site but leaves the production build to Vercel.
