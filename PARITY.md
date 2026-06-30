# Upstream parity manifest

`@qruto/nuxt-convex` is a **faithful Vue/Nuxt port** of Convex's official React/Next
integration plus the opt-in `@convex-dev/better-auth` and `@convex-dev/polar` add-ons. It is
kept **diffable against upstream** so new upstream releases can be tracked file-for-file —
including by an automated sync agent (see [AGENTS.md](./AGENTS.md) for the translation rules).

This file is the source of truth for **what maps to what** and **which upstream version each
area currently matches**. Keep it in sync with [README.md](./README.md)'s "Relationship to
upstream" table.

## Pinned baselines

The port currently matches these upstream versions:

| Upstream package | Baseline version | Notes |
|---|---|---|
| `convex` (`/react`, `/nextjs`, `/react-clerk`, `/react-auth0`) | **1.42.1** | Verified file-by-file against git tag `npm/1.42.1`. |
| `@convex-dev/better-auth` | **0.12.5** | `react` + `nextjs` + client plugins. |
| `@convex-dev/polar` | **0.9.2** | `react` components only. |

When bumping a baseline, diff the upstream paths below between the old and new tag, port real
changes, then update the version here.

## File mapping — core `convex`

| Upstream (`convex/src/...`) | Ported (`src/runtime/...`) |
|---|---|
| `react/client.ts` | `vue/client.ts` |
| `react/ConvexAuthState.tsx` | `vue/auth/index.ts` |
| `react/auth_helpers.tsx` | `vue/auth/helpers.ts` |
| `react/hydration.tsx` | `vue/hydration.ts` |
| `react/index.ts` | `vue/index.ts` |
| `react/use_queries.ts` | `vue/composables/use-queries.ts` |
| `react/queries_observer.ts` | `vue/queries-observer.ts` |
| `react/use_subscription.ts` | `vue/composables/use-subscription.ts` |
| `react/use_paginated_query.ts` + `react/use_paginated_query2.ts` | `vue/composables/use-paginated-query.ts` (merged) |
| `nextjs/index.ts` | `nuxt/index.ts` |
| `react-clerk/{ConvexProviderWithClerk.tsx,index.ts}` | `clerk/vue/index.ts` |
| `react-auth0/{ConvexProviderWithAuth0.tsx,index.ts}` | `auth0/vue/index.ts` |

## File mapping — add-ons

| Upstream | Ported (`src/runtime/...`) |
|---|---|
| `@convex-dev/better-auth` `src/react/index.tsx` (`AuthBoundary`, `usePreloadedAuthQuery`, provider) | `better-auth/vue/{auth-boundary,hydration,plugin.client,plugin.server,use-auth}.ts` |
| `@convex-dev/better-auth` `src/plugins/convex/client.ts` | `better-auth/vue/client.ts` |
| `@convex-dev/better-auth` `src/plugins/cross-domain/client.ts` | `better-auth/vue/cross-domain.ts` |
| `@convex-dev/better-auth` `src/nextjs/index.ts` (`convexBetterAuthNextJs`) | `better-auth/nuxt/server.ts` (`backendAuth`) |
| `@convex-dev/better-auth` `src/nextjs/client.tsx` (`usePreloadedAuthQuery`) | `better-auth/vue/hydration.ts` |
| `@convex-dev/polar` `src/react/index.tsx` (`CheckoutLink`, `CustomerPortalLink`) | `polar/vue/components.ts` |

Nuxt-specific files with no single upstream origin (the Nuxt request lifecycle has no React
equivalent): `better-auth/nuxt/middleware.ts`, `better-auth/nuxt/proxy.ts`.

## Vue-only additions (no upstream origin — keep, do not "sync away")

These are intentional Vue/Nuxt conveniences beyond `convex/react`'s surface:

- `vue/composables/use-query.ts`, `use-mutation.ts`, `use-action.ts`, `use-connection-state.ts`
  — Vue composable forms (React exposes these from `client.ts`); each also has a `useConvex*`
  alias to avoid name clashes.
- `vue/composables/use-upload.ts`, `use-upload-queue.ts`, `use-storage-url.ts` — file-storage
  helpers (not in `convex/react`).
- `vue/provide.ts` — `provideBackendApi` / `useBackendApi` app-API wiring.
- `vue/plugin.ts` — base Convex client Nuxt plugin (the Nuxt analog of the user manually
  rendering `<ConvexProvider client={…}>`; registered when no auth integration owns the client).
- `nuxt/config.ts`, `module.ts`, `functions-dir.ts` — Nuxt module wiring.

## Out of scope (deliberately not ported)

| Upstream | Why |
|---|---|
| `@convex-dev/resend` | Backend-only Convex component — no client surface. Use it from your Convex backend and call it via `useMutation` / `useAction`. |
| `convex/react-start`, `@convex-dev/better-auth` `src/react-start` | TanStack Start–specific (React framework adapter). |
| `convexQueryOptions` (`convex/react` `index.ts`) | Marked `@internal` upstream (TanStack Query interop). The public `QueryOptions` type **is** re-exported. |

## Intentional naming / shape divergences (idiomatic, not gaps)

`ConvexReactClient` → `ConvexVueClient`; `ReactMutation`/`ReactAction` → `VueMutation`/`VueAction`;
`<ConvexProvider>` component → plugin-based provide + `useConvex()`; static hook args →
`MaybeRefOrGetter`; `ConvexProviderWith*` components → `provideConvexAuthFrom*` composables (with
thin component wrappers kept for drop-in parity). `watchPaginatedQuery` throws by design —
pagination lives in the `usePaginatedQuery` composable layer (Convex's internal
`PaginatedQueryClient` is not a public export). See [AGENTS.md](./AGENTS.md).
