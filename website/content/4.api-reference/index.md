---
title: API Reference
description: Every auto-imported composable, component, and server helper, plus the generated TypeScript reference for each published module.
navigation: false
seo:
  title: Convex module API reference for Nuxt
---

Two hand-written index pages and the generated TypeDoc output.

- [App Auto-imports](/api-reference/auto-imports) — every composable and component auto-imported into pages, components, and composables.
- [Server Auto-imports](/api-reference/server-imports) — every helper auto-imported into Nitro server code.
- [Generated Reference](/api-reference/reference) — full TypeScript signatures for `client`, `app`, `server`, and each integration subpath.

For prose explanations of the same surface, start with the [Guide](/guide/queries).

## Subpath exports

Everything is auto-imported in Nuxt, but each surface is also a real subpath export of `nuxt-convex-module` — for explicit or type-only imports, and for a [plain Vue](/guide/plain-vue) app. Entries follow client/server naming, mirroring upstream's `convex/react` and `convex/nextjs` split.

**`/client` or `/vue`?** They are the same file. `/client` is the name the Nuxt guide and the generated reference use; `/vue` is its alias, there for a file that reads better with a Vue-flavoured import — most often a Nuxt-less app. Pick one per project.

| Import path | Contents |
|---|---|
| `nuxt-convex-module` | the Nuxt module (for `modules: []`) |
| `nuxt-convex-module/client` (alias `/vue`) | `ConvexVueClient`, `ConvexClientKey`, every composable (`useQuery`, `useMutation`, `useAction`, pagination, upload, …), auth (`provideConvexAuth`, `useConvexAuth`, `<Authenticated>` …), `usePreloadedQuery`, and all public types |
| `nuxt-convex-module/server` | Nitro/server: `fetchQuery`, `fetchMutation`, `fetchAction`, `preloadQuery`, `preloadedQueryResult` |
| `nuxt-convex-module/app` | Nuxt app context: `useAsyncQuery`, `useConvexAsyncQuery`, and the `AsyncQueryReturn` / `AsyncQueryOptions` / `AsyncQueryStatus` / `AsyncQueryData` types |
| `nuxt-convex-module/clerk/client` (alias `/clerk/vue`) | `provideConvexAuthFromClerk`, `<ConvexProviderWithClerk>` |
| `nuxt-convex-module/auth0/client` (alias `/auth0/vue`) | `provideConvexAuthFromAuth0`, `<ConvexProviderWithAuth0>` |
| `nuxt-convex-module/better-auth/client` (alias `/better-auth/vue`) | `useBetterAuth`, `authClient`, `usePreloadedAuthQuery`, `consumeCrossDomainOneTimeToken`, `resolveAuthRedirect`, `<AuthBoundary>`, and the `convexClient` / `crossDomainClient` client plugins (re-exported from `@convex-dev/better-auth/client/plugins`) |
| `nuxt-convex-module/better-auth/server` | Nitro/server: `convexAuth(event)` (auto-imported in server code; import explicitly for the `ConvexAuthOptions` / `ConvexAuthService` types) |
| `nuxt-convex-module/polar/client` (alias `/polar/vue`) | `<CheckoutLink>`, `<CustomerPortalLink>` |

The core, Clerk, Auth0 and Polar entries are self-contained and work in a plain Vue app; `/better-auth/*`, `/server` and `/app` rely on Nuxt-provided aliases, runtime config or `#app`, and need Nuxt.
