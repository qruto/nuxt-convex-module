# The documentation site

The Nuxt app behind the docs and the landing page, with the live demos embedded in the guide.

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

So the build command is `pnpm --dir .. run dev:prepare:lib && pnpm --dir .. run build && pnpm exec
nuxt build`, and the two root halves are both needed before the site's own build:

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
| Preview env | **nothing Convex-related** | Previews are off; see below |
| Deployment Protection → Vercel Authentication | **off** | Turned off while previews were public (Vercel's scopes are *all*, *previews only*, or *production URLs + previews* — there is no "production only"). With previews off it only exposes production's own `*.vercel.app` URLs; the production domain is exempt anyway, and this is a public docs site |

## Previews on a pull request

Vercel builds `main` only. `git.deploymentEnabled` in `vercel.json` turns every branch off
(`"**": false`) and `main` back on (`"main": true`): a branch deploys when any rule that matches
it is `true`. The pattern is `**`, not `*`, so branch names with a slash match too.

A pull request gets one preview: the **StackBlitz** link from the pkg.pr.new comment. It runs
`examples/playground`, a real Nuxt app on the PR's *package build*, against a development deploy
key you paste. To see the website as a branch would ship it, run it locally (below).

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

## When the demos are abused

The demos write to the production Convex deployment without a sign-up, and its URL is public, so
anyone can call the functions directly. Every public write passes a per-visitor rate limit (keyed
on the caller's IP address, IPv6 by its /64) and a global budget per demo, both in
`convex/gate.ts`. Free text passes the word filter in `convex/moderation.ts`. Uploads are listed
only in the browser that made them and are deleted after an hour.

If something still gets through:

- **Pause every demo write.** Run `npx convex env set DEMOS_PAUSED 1 --prod` from this folder;
  reads keep working and no deploy is needed. `npx convex env remove DEMOS_PAUSED --prod` resumes.
- **Clear what's already there.** In the Convex dashboard, open the table under Data and use
  *Clear table*.
- **Giving a live talk?** Everyone on one Wi-Fi shares one address, so they share one bucket.
  Raise the bucket the audience will use at the top of `convex/gate.ts` and deploy.

Three caps live outside the repository. Set them once:

| Where | Setting | Why |
| --- | --- | --- |
| Convex → production deployment → Settings → Usage limits | A daily *Function calls* limit with a warning and a disable threshold | A rejected call is still a billed call, so this is the only hard cap on Convex cost. Past it, the deployment is off until the day rolls over |
| Vercel → Firewall | A rate-limit rule on `/__docus__/assistant` | The Docus AI assistant needs no login. `nuxt.config.ts` limits it too, but only per server instance |
| Vercel → AI Gateway | A budget with auto top-up off | The assistant's hard cap |
