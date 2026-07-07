# Upstream parity manifest

`nuxt-convex-kit` is a **faithful Vue/Nuxt port** of Convex's official React/Next
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
| `@convex-dev/better-auth` `src/react/index.tsx` (export surface) | `better-auth/vue/index.ts` (public barrel) |
| `@convex-dev/better-auth` `src/react/index.tsx` (`AuthBoundary`, provider's `useUseAuthFromBetterAuth`) | `better-auth/vue/{auth-boundary,plugin.client,plugin.server,use-auth}.ts` |
| `@convex-dev/better-auth` `src/react/index.tsx` (provider's `?ott=` one-time-token `useEffect`) | `better-auth/vue/cross-domain.ts` (`consumeCrossDomainOneTimeToken`) |
| `@convex-dev/better-auth` `src/nextjs/index.ts` (`convexBetterAuthNextJs`) | `better-auth/nuxt/server.ts` (`backendAuth`) |
| `@convex-dev/better-auth` `src/nextjs/client.tsx` (`usePreloadedAuthQuery`) | `better-auth/vue/hydration.ts` |
| `@convex-dev/polar` `src/react/index.tsx` (`CheckoutLink`, `CustomerPortalLink`) | `polar/vue/components.ts` |

The Better Auth **client plugins** are framework-agnostic and **reused as-is** from the
dependency — not reimplemented: `convexClient` and `crossDomainClient` from
`@convex-dev/better-auth/client/plugins`. The bundled default client
(`better-auth/vue/client.ts`) is the Vue analog of the user-authored `createAuthClient({ plugins:
[convexClient(), …] })` that `convex/react`'s `ConvexBetterAuthProvider` takes as a prop. Apps
override it (to choose plugins, e.g. add `crossDomainClient()` for cross-domain auth) by pointing
`convex.betterAuth.authClient` at their own module; the runtime resolves it through the
`#convex/auth-client` alias. Both Convex client plugins are also re-exported from
`nuxt-convex-kit/better-auth/vue` for convenience.

Nuxt-specific files with no single upstream origin (the Nuxt request lifecycle has no React
equivalent): `better-auth/nuxt/middleware.ts`, `better-auth/nuxt/proxy.ts` (the proxy delegates
to `backendAuth(event).handler()`, which strips hop-by-hop headers and rewrites forwarded-host
headers exactly as `convexBetterAuthNextJs`'s `handler` does).

Known behavioral divergence: `backendAuth`'s JWT-cache retry deliberately inverts upstream
v0.12.5's `callWithToken` predicate — upstream retries with a force-refreshed token only when
`jwtCache.isAuthError(error)` is **false** (an apparent upstream bug); the port retries exactly
when the cached JWT is rejected as an auth error. See AGENTS.md's known divergences; do not sync
the condition back.

## Vue-only additions (no upstream origin — keep, do not "sync away")

These are intentional Vue/Nuxt conveniences beyond `convex/react`'s surface:

- `vue/composables/use-query.ts`, `use-mutation.ts`, `use-action.ts`, `use-connection-state.ts`
  — Vue composable forms (React exposes these from `client.ts`); each also has a `useConvex*`
  alias to avoid name clashes.
- `vue/composables/use-upload.ts`, `use-upload-queue.ts`, `use-storage-url.ts` — file-storage
  helpers (not in `convex/react`).
- `vue/provide.ts` — `provideBackendApi` / `useBackendApi` app-API wiring.
- `vue/auth/index.ts` also exports `createScopedConvexAuthState` — the `EffectScope`-wrapped
  variant of `createConvexAuthState`, used by the Better Auth client plugin to dispose the auth
  watchers.
- `better-auth/vue/use-auth.ts` service extension: beyond upstream's `{ isLoading,
  isAuthenticated, fetchAccessToken }`, the returned service exposes the raw `client`, the
  `session` ref, a `user` computed, and ergonomic wrappers (`signOut`, `sendOtp`,
  `signInWithOtp`, `signInWithPasskey`, `registerPasskey`, `changeEmail`, `deleteAccount`), plus
  the `AuthUser` / `UseAuthService` / `AuthSession` types. The OTP/passkey wrappers require the
  corresponding Better Auth client plugins (present in the bundled default client,
  `better-auth/vue/client.ts`).
- `vue/index.ts` barrel type conveniences beyond the upstream index surface: `PaginatedWatch`
  (the return type of `client.watchPaginatedQuery`) and `ConvexLogger` (backs
  `ConvexVueClientOptions.logger`) from the client module, plus type re-exports of
  `ConnectionState`, `OptimisticUpdate`, `QueryJournal` (`convex/browser`), `FunctionReference`,
  `FunctionArgs`, `FunctionReturnType`, `OptionalRestArgs`, `ArgsAndOptions` (`convex/server`)
  and `Value` (`convex/values`).
- `vue/plugin.ts` — base Convex client Nuxt plugin (the Nuxt analog of the user manually
  rendering `<ConvexProvider client={…}>`; registered when no auth integration owns the client).
- `nuxt/config.ts`, `module.ts`, `functions-dir.ts` — Nuxt module wiring.
- `runtime/devtools/**`, `devtools/**`, `devtools-client-app/` — Nuxt DevTools panel (dev-only). **Sync
  hazard:** `runtime/devtools/bridge.ts` deliberately observes `ConvexVueClient` from the
  outside so `vue/client.ts` stays byte-diffable against upstream — it reads the TS-private
  `listeners` map and `cachedSync`, and instance-patches `transition`/`close` at runtime. It
  also reaches the `@internal` `localQueryResultByToken` / `optimisticQueryResults.queryLogs`
  on `BaseConvexClient`. Re-check these against `browser/sync/client.ts` on every upstream
  bump; the canary tests in `test/unit/devtools-bridge.test.ts` fail loudly on a rename.
  Worst case is a broken dev panel, never a broken app (internal access is optional-chained).

## Out of scope (deliberately not ported)

| Upstream | Why |
|---|---|
| `@convex-dev/resend` | Backend-only Convex component — no client surface. Use it from your Convex backend and call it via `useMutation` / `useAction`. |
| `convex/react-start`, `@convex-dev/better-auth` `src/react-start` | TanStack Start–specific (React framework adapter). |
| `convexQueryOptions` (`convex/react` `index.ts`) | Marked `@internal` upstream (TanStack Query interop). The public `QueryOptions` type **is** re-exported. |
| `includePage` / `page` symbols, `usePaginatedQueryInternal` export, `UsePaginatedQueryInternalResult` (`convex/react` `use_paginated_query.ts`) | All marked `@internal` upstream and **stripped from the published type declarations** (reachable at runtime via `export *`, but not importable in TypeScript — verified against convex 1.42.1's shipped d.ts). The public typed `usePaginatedQuery(query, args, { initialNumItems })` surface is fully ported; the port's `usePaginatedQueryInternal` is a private, Vue-shaped implementation detail (reactive inputs, `ComputedRef` result, no `throwOnError` param — the error variant is returned as data and thrown by the public shapers, per the computed-poisoning rule). |

## Intentional naming / shape divergences (idiomatic, not gaps)

`ConvexReactClient` → `ConvexVueClient`; `ReactMutation`/`ReactAction` → `VueMutation`/`VueAction`
(`MutationOptions` keeps its upstream name — `VueMutationOptions` is an additive alias in the
same family);
`<ConvexProvider>` component → plugin-based provide + `useConvex()`; static hook args →
`MaybeRefOrGetter`; `ConvexProviderWith*` components → `provideConvexAuthFrom*` composables (with
thin component wrappers kept for drop-in parity); Polar component props keep upstream names
(`polarApi`, `productIds`) but `polarApi` is optional — it defaults to the auto-provided
`api.billing` namespace. `NextjsOptions` → `NuxtOptions`; `convexBetterAuthNextJs` →
`convexBetterAuthNuxt` (alias of `backendAuth`), taking the H3 `event` explicitly since Nitro
has no `next/headers`-style ambient request context (its returned service keeps upstream's
method names verbatim; `handler` returns `() => Promise<Response>` rather than a `{ GET, POST }`
route-handler pair). `ConvexAuthState` fields are `ComputedRef<boolean>`s (per the plain-value →
`ComputedRef` rule), so upstream's destructuring idiom stays reactive. The same treatment applies
to `usePaginatedQuery` (and the experimental positional overload): the docs' universal
`const { results, status, loadMore } = usePaginatedQuery(…)` idiom must stay reactive, so
`UsePaginatedQueryReturnType` is redefined as `{ results, status, isLoading: ComputedRef, loadMore }`
with a stable `loadMore` (upstream's plain union stays exported as `UsePaginatedQueryResult`).
The experimental *object form* still returns `ComputedRef<UsePaginatedQueryObjectReturnType>` whole —
splitting it would lose the `status`/`data`/`error` discriminated-union narrowing. Re-auth on
`fetchAccessToken` identity change is expressed by passing the fetcher as a `Ref`/`ComputedRef`
(or via the additive `authVersion` key). `usePreloadedAuthQuery` declares
`| null | undefined` — upstream declares `| null` but also yields `undefined` at runtime.
`watchPaginatedQuery` throws by design — pagination lives in the `usePaginatedQuery` composable
layer (Convex's internal `PaginatedQueryClient` is not a public export). See
[AGENTS.md](./AGENTS.md).
