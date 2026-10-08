---
name: nuxt-convex-module
description: >-
  Install and use nuxt-convex-module, the Nuxt module that connects a Nuxt (or
  plain Vue) app to a Convex backend. Use when adding Convex to a Nuxt app,
  when writing Nuxt or Vue code that reads or writes Convex data — useQuery,
  useAsyncQuery, useMutation, useAction, usePaginatedQuery, file uploads,
  fetchQuery in server routes, auth state with Better Auth, Clerk or Auth0,
  Polar checkout links — or when a Nuxt app's Convex setup misbehaves: no
  deployment URL, missing codegen, `#convex/api` typed as any, a built server
  that cannot find `convex`, a local backend still running on its port.
license: MIT
---

# nuxt-convex-module

A Vue and Nuxt port of Convex's own React client (`convex/react`, `convex/nextjs`, `@convex-dev/better-auth`, `@convex-dev/polar`). The public API keeps Convex's names, arguments and return shapes, so Convex's React docs and examples translate line for line. The differences are Vue ones: composables return refs (`ComputedRef`, `ShallowRef`), and arguments accept a value, a ref or a getter.

## Not installed yet?

If `nuxt-convex-module` is not in `package.json`, or not in the `modules` array of `nuxt.config.ts`, follow [references/install.md](references/install.md) first. It covers new and existing apps, a Convex deployment without an account, and how to verify the result.

## Ask before touching the user's Convex account

Ask the user, and wait for a yes, before any command that logs in to Convex or creates or changes something in their Convex account: `npx convex login`, `npx convex deploy`, and `npx convex dev` or `npx convex env set` against a cloud deployment. This applies in the auth and billing references too. A secret the user pastes (a Polar token, say) is not a yes to store it. A local deployment (`CONVEX_DEPLOYMENT=anonymous:…` in `.env.local`, or `CONVEX_AGENT_MODE=anonymous npx convex dev --once`) lives on this machine, so commands against it need no approval.

## Where things live

- Convex functions are in `convex/` (or the `functions` path in `convex.json`). Backend code is plain Convex: follow `convex/_generated/ai/guidelines.md` when it exists (`npx convex ai-files install` writes it), or Convex's own skills (`npx skills add get-convex/agent-skills`).
- Import function references from `#convex/api`: `import { api } from '#convex/api'`. `#convex/dataModel` and `#convex/server` alias the other generated files.
- `convex dev` generates `convex/_generated/`. Until it exists, `#convex/*` imports are typed `any`. Run `npx convex dev --once` before type-checking.
- Composables, components and server helpers are auto-imported. Don't import from `convex/react`; that is React.
- In development the module reads the deployment URL from the `.env.local` that `convex dev` writes. A production build reads `NUXT_PUBLIC_CONVEX_URL` (and `NUXT_PUBLIC_CONVEX_SITE_URL`). Never hardcode a deployment URL.
- The `dev` script is `convex dev --start "nuxt dev"`: one long-running command for Convex and Nuxt. When you start it to check something, run it in the background and stop it afterwards.

## Reading data

| You need | Use |
|---|---|
| Page data rendered on the server and kept live in the browser | `useAsyncQuery(api.x.list, args)` → `{ data, status, error, refresh }`, awaitable |
| Live data on the client only | `useQuery(api.x.get, args)` → `ComputedRef`, `undefined` while loading; errors throw |
| A set of queries that changes at runtime | `useQueries(() => ({ key: { query, args } }))` → errors returned per key |
| A growing list | `usePaginatedQuery(api.x.page, args, { initialNumItems: 20 })` → `results`, `status`, `loadMore(n)` |
| A growing list with the first page server-rendered | `useAsyncPaginatedQuery(…)` |
| One call from a server route or Nitro middleware | `fetchQuery`, `fetchMutation`, `fetchAction` (auto-imported in Nitro) |
| Data preloaded on the server and hydrated live | `preloadQuery` in a server route, then `usePreloadedQuery(preloaded)` in the component |

Pass `'skip'` as the args (or a getter returning it) to pause a query:

```ts
const profile = useQuery(api.users.get, () => userId.value ? { userId: userId.value } : 'skip')
```

In app code that runs during SSR (pages, `useAsyncData`), import the server helpers explicitly from `nuxt-convex-module/server`; they are auto-imported only in Nitro.

## Writing data

```vue
<script setup lang="ts">
import { api } from '#convex/api'

const { data: messages } = useAsyncQuery(api.messages.list, {})
const send = useMutation(api.messages.send)
const analyze = useAction(api.analyze.text) // a plain async function, not reactive
</script>
```

`useMutation(ref).withOptimisticUpdate((localStore, args) => { … })` updates local query results before the server answers. Call it once per `useMutation`, not per call.

## Files

- `useUpload(api.files.generateUploadUrl)` → `upload(file)` resolves to the storage id, or `null` with the reason in `error`. It never throws.
- `useUploadQueue(…)` for several files, `uploadFile({ url, file })` for a one-off.
- `useStorageUrl(api.files.getUrl, storageId)` → the file URL; `<ConvexImage :get-url="api.files.getUrl" :storage-id="id">` renders it as an image.

The Convex side needs a mutation returning `ctx.storage.generateUploadUrl()` and a query returning `ctx.storage.getUrl(storageId)`.

## Auth

- Provider-agnostic state: `useConvexAuth()` → `isLoading`, `isAuthenticated`; components `<Authenticated>`, `<Unauthenticated>`, `<AuthLoading>`, `<AuthRefreshing>`.
- Better Auth, Clerk and Auth0 switch on when their package is installed. Setup on both sides: [references/auth.md](references/auth.md).
- During SSR the auth state reads as loading. Server-render signed-in data through the request instead: `convexAuth(event)` on the server (Better Auth).

## Billing

Polar's `<CheckoutLink>` and `<CustomerPortalLink>` switch on when `@convex-dev/polar` is installed and read their actions from `api.billing`: [references/polar.md](references/polar.md).

## Plain Vue

The same client runs without Nuxt. Create a `ConvexVueClient`, provide it under `ConvexClientKey`, and import every composable from `nuxt-convex-module/vue`; there are no auto-imports, no `#convex/*` aliases and no server helpers. The setup is in [the plain Vue guide](https://nuxt-convex-module.dev/raw/guide/plain-vue.md).

## Docs

Every page is Markdown at the links below; the docs MCP server at `https://nuxt-convex-module.dev/mcp` serves the same pages through `get-page`.

- [Installation](https://nuxt-convex-module.dev/raw/getting-started/installation.md), [Configuration](https://nuxt-convex-module.dev/raw/getting-started/configuration.md) (module options, runtime config, `#convex/*` aliases), [Troubleshooting](https://nuxt-convex-module.dev/raw/getting-started/troubleshooting.md) (every message the module prints, and two from the Convex CLI and Node, with the fix), [Security](https://nuxt-convex-module.dev/raw/getting-started/security.md)
- Guide: [Queries](https://nuxt-convex-module.dev/raw/guide/queries.md), [Mutations and actions](https://nuxt-convex-module.dev/raw/guide/mutations-and-actions.md), [Pagination](https://nuxt-convex-module.dev/raw/guide/pagination.md), [File storage](https://nuxt-convex-module.dev/raw/guide/file-storage.md), [Server and SSR](https://nuxt-convex-module.dev/raw/guide/server-and-ssr.md), [Auth state](https://nuxt-convex-module.dev/raw/guide/auth-state.md), [Connection state](https://nuxt-convex-module.dev/raw/guide/connection-state.md)
- Components: [Better Auth](https://nuxt-convex-module.dev/raw/components/better-auth.md), [Clerk](https://nuxt-convex-module.dev/raw/components/clerk.md), [Auth0](https://nuxt-convex-module.dev/raw/components/auth0.md), [Polar](https://nuxt-convex-module.dev/raw/components/polar.md)
- Recipes: [Infinite scroll](https://nuxt-convex-module.dev/raw/recipes/infinite-scroll.md), [Optimistic list](https://nuxt-convex-module.dev/raw/recipes/optimistic-list.md), [Protected page](https://nuxt-convex-module.dev/raw/recipes/protected-page.md), [Image upload](https://nuxt-convex-module.dev/raw/recipes/image-upload.md)
- Every auto-import: [app](https://nuxt-convex-module.dev/raw/api-reference/auto-imports.md), [server](https://nuxt-convex-module.dev/raw/api-reference/server-imports.md)
