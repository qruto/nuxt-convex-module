# Upstream parity manifest

`nuxt-convex-module` is a **faithful Vue/Nuxt port** of Convex's own client code, kept
**diffable against upstream** so each release can be tracked file-for-file. This file is the
contract and the ledger: what is ported, the rules it is held to, every place it deliberately
bends, and what moves on a sync. The sync procedure itself is the
[`upstream-parity` skill](./.agents/skills/upstream-parity/SKILL.md); repository conventions
are in [AGENTS.md](./AGENTS.md).

---

## 1. What is ported

| Upstream package | Baseline version | Diffed against |
|---|---|---|
| `convex` (`/react`, `/nextjs`, `/react-clerk`, `/react-auth0`) | **1.45.0** | tag `npm/1.45.0` in [get-convex/convex-js](https://github.com/get-convex/convex-js) |
| `@convex-dev/better-auth` | **0.12.5** | tag `v0.12.5` in [get-convex/better-auth](https://github.com/get-convex/better-auth) |
| `@convex-dev/polar` | **0.9.2** | tag `v0.9.2` in [get-convex/polar](https://github.com/get-convex/polar) |

A baseline is the version the ported files were diffed against — not what a consumer may
install, which is the wider `peerDependencies` range in `package.json`.

The port draws on two distinct upstream sources, pinned separately.

### Convex's own client

The framework integrations Convex ships **inside the `convex` package**. All four are ported in
full, always part of the module, and covered by the one `convex` baseline.

| Upstream entry point | Ported to | Status |
|---|---|---|
| [`convex/react`](https://docs.convex.dev/client/react) — the client, every hook, auth state, helper components | `src/runtime/vue/**` | Complete + additive · D-01, D-02, D-05, D-06, D-07 |
| [`convex/nextjs`](https://docs.convex.dev/client/react/nextjs/server-rendering) — `fetchQuery` / `fetchMutation` / `fetchAction`, `preloadQuery` | `src/runtime/nuxt/index.ts` | Complete + additive · D-10 |
| [`convex/react-clerk`](https://docs.convex.dev/auth/clerk) — the official Clerk adapter | `src/runtime/clerk/vue/index.ts` | Complete |
| [`convex/react-auth0`](https://docs.convex.dev/auth/auth0) — the official Auth0 adapter | `src/runtime/auth0/vue/index.ts` | Complete |
| `convex/react-start` | — | Out of scope (X-02) |

### Convex components

[Components](https://www.convex.dev/components) are backend modules published as their own
npm packages. Some ship a React/Next client alongside the backend half; those clients get the
same treatment — a Vue/Nuxt port on the upstream's own API — but each is **opt-in**, activating
when the component is installed, and each sits on **its own** baseline.

| Upstream | Ported to | Status |
|---|---|---|
| `@convex-dev/better-auth` — `react` client | `src/runtime/better-auth/vue/**` | Complete + additive · D-03, D-11 |
| `@convex-dev/better-auth` — `nextjs` server helpers | `src/runtime/better-auth/nuxt/**` | Complete + additive · D-04, D-08 |
| `@convex-dev/better-auth` — client plugins (`convexClient`, `crossDomainClient`) | imported as-is from `@convex-dev/better-auth/client/plugins` | Reused, never reimplemented |
| `@convex-dev/better-auth` — `react-start` | — | Out of scope (X-02) |
| `@convex-dev/polar` — `react` components | `src/runtime/polar/vue/components.ts` | Complete + additive · D-09 |
| `@convex-dev/resend` | — | Out of scope (X-01) — ships no client |

**Status** · *Complete*: the whole public surface, same names, same arguments, same return
shapes; the only differences are shape changes [§2.2](#22-translation-rules) sanctions.
*+ additive*: plus Vue/Nuxt extras upstream lacks ([§3.3](#33-port-only-additions-a-)); nothing
upstream ships is missing or renamed. *D-nn*: the port deliberately *behaves* differently
there, each explained in [§3.2](#32-behaviour-d-).

### Not ported (`X-*`)

Each reason is expected to stay true across releases. If one stops being true, that is a scope
decision to revisit, not a gap to quietly fill.

#### X-01 — `@convex-dev/resend`

Server-only component; no client surface exists. Install it in the Convex deployment and call
its functions with the ordinary `useMutation` / `useAction`.

#### X-02 — TanStack Start adapters

`convex/react-start` and `@convex-dev/better-auth` `src/react-start`. Adapters for a different
React meta-framework; Nuxt is the analog this package already is.

#### X-03 — `convexQueryOptions`

`@internal` upstream (TanStack Query interop). The public `QueryOptions` type **is** re-exported.

#### X-04 — `baseClient` option and `BaseConvexClientInterface`

Added upstream in 1.42.2 (`react/client.ts`, `browser/sync/client.ts`), both `@internal` and
stripped from the published types. Injecting a pre-built `BaseConvexClient` is not public
surface; `ConvexVueClient` constructs its own.

#### X-05 — `PaginatedQueryClient`

`browser/sync/paginated_query_client.ts`. `@internal` and absent from `convex`'s `exports` map,
so a third-party package cannot import it at all. The port re-implements page management from
`react/use_paginated_query.ts` instead, and **both** `usePaginatedQuery` and
`usePaginatedQuery_experimental` run on that — only the experimental single-request network
path is not reproduced. Consequences: D-05, D-06, D-07.

#### X-06 — `@internal` paginated-query symbols

`includePage` / `page`, the `usePaginatedQueryInternal` export, `UsePaginatedQueryInternalResult`
(`react/use_paginated_query.ts`). All `@internal` and stripped from the published `.d.ts` —
reachable at runtime via `export *`, not importable in TypeScript. The public typed
`usePaginatedQuery(query, args, { initialNumItems })` surface is fully ported. The port's own
`usePaginatedQueryInternal` is a private, Vue-shaped detail: reactive inputs, a `ComputedRef`
result, no `throwOnError` parameter (D-02 covers the error path).

### File by file

Verified `@internal` claims above are against the *published* `.d.ts` of convex 1.45.0, not the
source.

**Convex's own client** (`convex/src/…` → `src/runtime/…`)

| Upstream | Ported |
|---|---|
| `react/client.ts` | `vue/client.ts` — hooks split out into `vue/composables/*` (N-12) |
| `react/ConvexAuthState.tsx` | `vue/auth/index.ts` |
| `react/auth_helpers.tsx` | `vue/auth/helpers.ts` |
| `react/hydration.tsx` | `vue/hydration.ts` |
| `react/index.ts` | `vue/index.ts` |
| `react/use_queries.ts` | `vue/composables/use-queries.ts` |
| `react/queries_observer.ts` | `vue/queries-observer.ts` |
| `react/use_subscription.ts` | `vue/composables/use-subscription.ts` |
| `react/use_paginated_query.ts` + `react/use_paginated_query2.ts` | `vue/composables/use-paginated-query.ts` — merged (N-11) |
| `common/index.ts` — `validateDeploymentUrl` | mirrored verbatim inside `nuxt/index.ts`; `convex` has no `convex/common` export |
| `nextjs/index.ts` | `nuxt/index.ts` |
| `react-clerk/{ConvexProviderWithClerk.tsx,index.ts}` | `clerk/vue/index.ts` |
| `react-auth0/{ConvexProviderWithAuth0.tsx,index.ts}` | `auth0/vue/index.ts` |

**Convex components** (`<package>/src/…` → `src/runtime/…`)

| Upstream | Ported |
|---|---|
| better-auth `react/index.tsx` — export surface | `better-auth/vue/index.ts` |
| better-auth `react/index.tsx` — `AuthBoundary`, provider's `useUseAuthFromBetterAuth` | `better-auth/vue/{auth-boundary,plugin.client,plugin.server,use-auth}.ts` |
| better-auth `react/index.tsx` — provider's `?ott=` `useEffect` | `better-auth/vue/cross-domain.ts` |
| better-auth `nextjs/index.ts` — `convexBetterAuthNextJs` | `better-auth/nuxt/server.ts` — `convexAuth` |
| better-auth `nextjs/client.tsx` — `usePreloadedAuthQuery` | `better-auth/vue/hydration.ts` |
| better-auth — the user-authored `createAuthClient({ plugins: [convexClient(), …] })` passed to `ConvexBetterAuthProvider` | `better-auth/vue/client.ts` — bundled default, overridden by pointing `convex.betterAuth.authClient` at your own module (resolved through the `#convex/auth-client` alias) |
| polar `react/index.tsx` — `CheckoutLink`, `CustomerPortalLink` | `polar/vue/components.ts` |

**Port-only files** — no upstream origin; each is an `A-*` entry in [§3.3](#33-port-only-additions-a-)

| Ported | Role | Entry |
|---|---|---|
| `vue/composables/{use-query,use-mutation,use-action,use-connection-state}.ts` | homes for hooks upstream declares in `client.ts` | N-12 |
| `vue/composables/{use-upload,use-upload-queue,use-storage-url}.ts` | file-storage helpers | A-02 |
| `vue/provide.ts` | `provideConvexApi` / `useConvexApi` | A-03 |
| `vue/plugin.ts`, `better-auth/vue/plugin.{client,server}.ts` | Nuxt plugins standing in for provider components | A-07 |
| `nuxt/composables/use-async-query.ts` | `useAsyncQuery` | A-04 |
| `nuxt/csp.ts`, `nuxt/security.ts` | Convex-aware CSP + `nuxt-security` route rules | A-11 |
| `nuxt/config.ts`, `src/module.ts`, `src/functions-dir.ts` | module wiring | A-09 |
| `runtime/devtools/**`, `devtools/**`, `devtools-client-app/` | DevTools panel (dev-only) | A-15 |
| `better-auth/nuxt/middleware.ts`, `better-auth/vue/redirect.ts` | `auth` route middleware + its redirect guard | A-12 |
| `better-auth/nuxt/proxy.ts` | the `${authRoute}/**` server handler | A-14 |

---

## 2. How parity is held

### 2.1 The contract

Public interface names match upstream **verbatim** unless a rule in
[§2.2](#22-translation-rules) sanctions the difference. Vue conveniences are strictly additive:
a required upstream prop may become optional with an auto-provided default; nothing is renamed,
nothing is dropped. User-facing error and warning texts stay verbatim too, modulo the sanctioned
name substitutions, so tests and log-matching written against upstream keep working.

The same goes for code *shape*. Keep upstream's destructuring, branch order and early returns
wherever Vue doesn't force a change, so a side-by-side diff shows only the sanctioned
translations, never stylistic drift. This extends to **internal** symbols: keep upstream's
names even when unexported (`splitQuery`, `createInitialState`) and declare them in the same
order as the upstream file. When a lint or complexity rule conflicts with an upstream line,
scope the rule off for `src/runtime/**` — never rewrite the line.

### 2.2 Translation rules

The sanctioned translations. Anything a rule here covers is a shape change, not a divergence —
it is recorded as an `N-*` row in [§3.1](#31-naming-and-shape-n-), never as a `D-*` entry.

| React / Next | Vue / Nuxt |
|---|---|
| Hook `useX()` | Composable `useX()` (auto-imported); add a `useConvexX` alias to avoid name clashes |
| `ConvexReactClient` | `ConvexVueClient` |
| `ReactMutation` / `ReactAction` | `VueMutation` / `VueAction` |
| `<ConvexProvider client>` component | Plugin provides the client via `ConvexClientKey`; read with `useConvex()` |
| `<ConvexProviderWithAuth useAuth>` | `provideConvexAuth({ client, useAuth })` composable |
| `<ConvexProviderWithClerk>` / `<ConvexProviderWithAuth0>` | `provideConvexAuthFromClerk` / `provideConvexAuthFromAuth0` composables (+ thin component wrappers) |
| `useState` / `useEffect` reconciliation | `ref` + `watch` / `watchEffect` (see `vue/auth/index.ts` for the auth-state port and the comments explaining the live-sign-out edge case) |
| `setState(updater)` functional update | `state.value = updater(state.value)` — keep upstream's module-level curried updaters as-is (see `splitQuery` / `completeSplitQuery`) |
| Static hook arguments | `MaybeRefOrGetter` inputs, read via `toValue` |
| Returns a plain value | Returns `ComputedRef` / `ShallowRef` (VueUse convention) |
| JSX helper components (`<Authenticated>`, …) | `defineComponent` render functions in `vue/auth/helpers.ts` |
| Function-component name (automatic in React) | Explicit `name:` option — a plain-`.ts` `defineComponent` is otherwise `<Anonymous>` in devtools/warnings |
| `{ children: ReactNode }` typing | Nothing — Vue components accept a default slot implicitly; do **not** add `slots: SlotsType<…>` declarations |
| Next.js server helpers (`preloadQuery`, `fetchQuery`, …) | Nitro server utils in `nuxt/index.ts` (auto-imported on the server); helper names stay verbatim |
| Framework-qualified names (`NextjsOptions`, `convexBetterAuthNextJs`) | Substitute the framework part only: `NuxtOptions`, `convexBetterAuthNuxt` |
| Ambient per-request context (`next/headers` + `React.cache`) | Explicit H3 `event` parameter (Nitro has no ambient request context) |
| `React.cache` per-request memoization | Memoize on `event.context` (see `convexAuth`'s token cache) |
| `fetchAccessToken` identity change between renders (re-auth trigger) | Pass the fetcher as a `Ref`/`ComputedRef` whose identity changes (or bump the port-only `authVersion` key) |

Reuse the generic primitives instead of writing new auth cores: the Clerk and Auth0 adapters
are thin shims over `provideConvexAuth` / `createConvexAuthState` (`vue/auth/index.ts`). When
an upstream "provider" component takes a `useAuth` prop, port it as a `useAuthFromX` shim
feeding `provideConvexAuth`.

### 2.3 Enforcement

What makes the contract a property of the repo rather than a promise:

- **Upstream types are imported, never redeclared.** `UseQueryResult`, `RequestForQueries`,
  the paginated-query types, `Watch`, `MutationOptions` are re-exported type-only from
  `convex/react`. `vue-tsc` breaks if upstream changes a shape the port claims to mirror — the
  closest thing to an automated surface check.
- **Lint is scoped off, not satisfied.** [`eslint.config.js`](./eslint.config.js) disables five
  rules under `src/runtime/**` (`no-dynamic-delete`, `no-explicit-any`, `no-empty-object-type`,
  `prefer-type-error`, `check-param-names`) so upstream lines survive as written.
- **Complexity ceilings are raised for verbatim ports.** [`.fallowrc.jsonc`](./.fallowrc.jsonc)
  lifts the cyclomatic and cognitive limits for `use-paginated-query.ts` and
  `queries-observer.ts`, with a `reason` citing this file.
- **Upstream's tests are the safety net.** The React suite (last present at tag `npm/1.35.0`,
  removed later) was ported into `test/` and extended for Nuxt — `test/unit/vue/auth-websocket.test.ts`
  and `test/unit/vue/convex-auth-state.test.ts` name their upstream origin. Three guards sit on
  top:

| Guard | Fails when |
|---|---|
| `test/unit/upstream-baselines.test.ts` | a baseline bump misses one of the four version sites ([§4](#4-keeping-parity)) |
| `test/unit/parity-manifest.test.ts` | this file stops describing the source tree — a runtime file with no row, a mapped path that no longer exists, a `PARITY:` marker with no entry, a `D-*` entry with no marker, a cited test that is gone |
| `test/unit/devtools-bridge.test.ts` | an upstream sync renames a client internal the DevTools bridge reads |

---

## 3. Where the port bends

Every deliberate difference from upstream has a stable ID here, a `PARITY: <ID>` comment marker
at the source site, and a named test that pins it. Entries are grouped by *kind* of difference,
because that is what decides how to treat one on a sync.

- **`N-*` — naming and shape.** Vue expresses the same thing differently; behaviour is
  unchanged. Each cites the [§2.2](#22-translation-rules) rule that sanctions it.
- **`D-*` — behaviour.** The port deliberately does something upstream does not. Each says why,
  and what to do on the next sync.
- **`A-*` — port-only additions.** No upstream origin. Strictly additive; never "sync away".

### 3.1 Naming and shape (`N-*`)

| ID | Upstream | Port | Sanctioned by · port-specific notes |
|---|---|---|---|
| <a id="n-01"></a>**N-01** | `ConvexReactClient` | `ConvexVueClient` | *Framework-qualified names* |
| <a id="n-02"></a>**N-02** | `ReactMutation` / `ReactAction` | `VueMutation` / `VueAction` | *`ReactMutation` / `ReactAction`*. `MutationOptions` keeps its upstream name; `VueMutationOptions` is an additive alias in the same family |
| <a id="n-03"></a>**N-03** | `<ConvexProvider client>` component | Nuxt plugin + `ConvexClientKey` + `useConvex()` | *`<ConvexProvider client>` component* |
| <a id="n-04"></a>**N-04** | `<ConvexProviderWithAuth>` / `WithClerk` / `WithAuth0` | `provideConvexAuth` / `provideConvexAuthFromClerk` / `provideConvexAuthFromAuth0` | *`<ConvexProviderWithAuth useAuth>`*, *`<ConvexProviderWithClerk>` / `<ConvexProviderWithAuth0>`*. Thin component wrappers are kept for drop-in parity |
| <a id="n-05"></a>**N-05** | Static hook arguments | `MaybeRefOrGetter`, read via `toValue` | *Static hook arguments* |
| <a id="n-06"></a>**N-06** | Returns a plain value | Returns `ComputedRef` / `ShallowRef` | *Returns a plain value*. Applies to `ConvexAuthState` and to `UsePaginatedQueryReturnType`, redefined as `{ results, status, isLoading: ComputedRef, loadMore }` with a stable `loadMore`; upstream's plain union stays exported as `UsePaginatedQueryResult` |
| <a id="n-07"></a>**N-07** | `NextjsOptions`, `convexBetterAuthNextJs` | `NuxtOptions`, `convexBetterAuthNuxt` | *Framework-qualified names* + *Ambient per-request context*. `handler` returns `() => Promise<Response>` rather than a `{ GET, POST }` pair |
| <a id="n-08"></a>**N-08** | Polar `polarApi`, `productIds` props | Same names; `polarApi` optional | [§2.1](#21-the-contract) — a required prop may become optional with an auto-provided default (`api.billing`). Names stay verbatim |
| <a id="n-09"></a>**N-09** | better-auth `convexSiteUrl`, required | Optional; falls back to runtime config / `NUXT_PUBLIC_CONVEX_SITE_URL` | [§2.1](#21-the-contract), same rule as N-08. An upstream call site passing it behaves identically, and a missing value still throws. Its sibling `convexUrl` is accepted and ignored — upstream requires but never reads it either. Pinned by `test/unit/auth/nuxt/server.test.ts` |
| <a id="n-10"></a>**N-10** | `useAuthFromBetterAuth` | `useAuth` | The provider prop it fed does not exist here; the service is consumed directly |
| <a id="n-11"></a>**N-11** | `use_paginated_query.ts` + `use_paginated_query2.ts` | one `use-paginated-query.ts` | Both files' exports form one composable surface; splitting them in Vue would duplicate the state machine |
| <a id="n-12"></a>**N-12** | Hooks declared in `react/client.ts` | `vue/composables/{use-query,use-mutation,use-action,use-connection-state}.ts` | *Hook `useX()`*. `vue/index.ts` re-exports them in upstream's order; `vue/client.ts` carries a header naming the split |
| <a id="n-13"></a>**N-13** | New `fetchAccessToken` identity between renders re-triggers auth | Pass the fetcher as a `Ref`/`ComputedRef`, or bump the additive `authVersion` key | *`fetchAccessToken` identity change between renders* |
| <a id="n-14"></a>**N-14** | `RequestForQueries`, `EmptyObject`, `LoadMoreOfPaginatedQuery`, `PaginatedQueryResult` | Re-exported from `convex/react`, or inlined where upstream imports from a non-exported path | [§2.3](#23-enforcement) — never redeclared where an import is possible |
| <a id="n-15"></a>**N-15** | `usePaginatedQuery_experimental` object form | Returns `ComputedRef<UsePaginatedQueryObjectReturnType>` whole | Splitting it into refs would lose the `status`/`data`/`error` discriminated-union narrowing |

### 3.2 Behaviour (`D-*`)

#### Forced by the Vue/Nitro runtime

The port had no choice. Each of these *preserves* an upstream invariant that React or Next gets
for free — removing one would break the behaviour, not restore it.

##### D-01 — subscriptions and `setAuth` are skipped during SSR

- **Kind** · Vue runs `watchEffect` bodies during SSR setup; React never runs passive effects
- **Upstream** · `convex@1.45.0` `react/use_subscription.ts`, `react/use_queries.ts`, `react/ConvexAuthState.tsx` — all subscribe inside `useEffect`
- **Port** · [`vue/composables/use-subscription.ts`](./src/runtime/vue/composables/use-subscription.ts), [`vue/composables/use-queries.ts`](./src/runtime/vue/composables/use-queries.ts), [`vue/auth/index.ts`](./src/runtime/vue/auth/index.ts)
- **Pinned by** · `test/unit-server/ssr-subscription-guard.test.ts`, `test/unit-server/ssr-auth-guard.test.ts`
- **On sync** · keep every `import.meta.server` short-circuit
- **Why** · `onCleanup` never fires during SSR setup, so without the guard each request would
  open a WebSocket on the server that nothing closes. The render-time reads upstream performs
  (`getLocalResults`, the initial `getCurrentValue()`) still happen.

##### D-02 — `useQuery` returns a lazy computed that throws when read

- **Kind** · a composable body runs once — there is no render phase to throw in
- **Upstream** · `convex@1.45.0` `react/client.ts` — `useQuery` throws inside the hook call
- **Port** · [`vue/composables/use-query.ts`](./src/runtime/vue/composables/use-query.ts)
- **Pinned by** · `test/unit/use-query.test.ts`, `test/nuxt/auth/vue/auth-boundary.test.ts`
- **On sync** · keep. Knock-on: `AuthBoundary` must read `user.value` during render, where
  upstream discards the hook result because its throw already happened
- **Why** · the error surfaces when `.value` is read during render and propagates to the nearest
  `errorCaptured` boundary — React's `<ErrorBoundary>` analog. The same rule is why the
  paginated-query shapers check the internal `'Error'` variant per field: a computed whose
  getter throws serves its stale cached value to the next dependent read.

##### D-03 — `isAuthenticated` settles to signed-out without a re-render

- **Kind** · no re-render between a session settling and the cache-clearing effect
- **Upstream** · `@convex-dev/better-auth@0.12.5` `react/index.tsx` — `Boolean(session?.session) || cachedToken !== null`
- **Port** · [`better-auth/vue/use-auth.ts`](./src/runtime/better-auth/vue/use-auth.ts)
- **Pinned by** · `test/unit/auth/vue/use-auth.test.ts` — "treats a settled missing session as
  unauthenticated even with a stale cached token"
- **On sync** · keep the predicate; port changes to the *inputs*, not the shape
- **Why** · a settled signed-out session must read unauthenticated immediately, so
  `cachedToken !== null` would strand the user as authenticated. And Better Auth session data
  without a nested `session` object still means signed in, which `session?.session` misses.

##### D-04 — stale `Content-Encoding` / `Content-Length` are stripped from the proxied response

- **Kind** · undici decompresses transparently but leaves the headers describing the compressed body
- **Upstream** · `@convex-dev/better-auth@0.12.5` `nextjs/index.ts` — `return fetch(nextUrl, init)`
- **Port** · [`better-auth/nuxt/server.ts`](./src/runtime/better-auth/nuxt/server.ts) — `handler`
- **Pinned by** · `test/unit/auth/nuxt/server.test.ts` — "strips stale content-encoding/length
  from the proxied response"
- **On sync** · keep; forwarding those two headers verbatim is a correctness bug here
- **Why** · relaying them makes the browser decode an already-decoded response
  (`ERR_CONTENT_DECODING_FAILED`). Every other header is preserved, `Set-Cookie` and `Location`
  included.

#### Consequences of an unimportable upstream internal

All three follow from `PaginatedQueryClient` being unreachable ([X-05](#x-05--paginatedqueryclient)).
The port re-implements page management from `react/use_paginated_query.ts` instead, so anything
upstream routes through that client has to land somewhere else here.

##### D-05 — `watchPaginatedQuery` throws instead of returning a watch

- **Upstream** · `convex@1.45.0` `react/client.ts` — `ConvexReactClient.watchPaginatedQuery`
- **Port** · [`vue/client.ts`](./src/runtime/vue/client.ts) — `ConvexVueClient.watchPaginatedQuery`
- **Pinned by** · `test/unit/client.test.ts` — "watchPaginatedQuery"
- **On sync** · keep the throw; port page-management changes into `use-paginated-query.ts`
- **Why** · upstream's method only hands work to `PaginatedQueryClient`. It is retained for
  structural parity and throws loudly rather than silently mis-subscribing.

##### D-06 — the sync client's transition callback is wired directly

- **Upstream** · `convex@1.45.0` `react/client.ts` — the `BaseConvexClient` construction in `get sync()`
- **Port** · [`vue/client.ts`](./src/runtime/vue/client.ts) — `cachedSync`
- **Pinned by** · `test/unit/client.test.ts`
- **On sync** · keep; re-check if upstream stops routing transitions through `PaginatedQueryClient`
- **Why** · upstream passes a no-op handler and routes every transition through the internal
  client. Without it, the callback goes straight to `transition()`.

##### D-07 — split pages inherit the split page's `paginationOpts`

- **Upstream** · `convex@1.45.0` `browser/sync/paginated_query_client.ts` — `splitPaginatedQueryPage` resets `numItems` to `initialNumItems`
- **Port** · [`vue/composables/use-paginated-query.ts`](./src/runtime/vue/composables/use-paginated-query.ts) — `splitQuery`
- **Pinned by** · `test/nuxt/use-paginated-query.test.ts` — "page split", "splits a non-first
  page from that page's own cursor, not the start of the list"
- **On sync** · keep
- **Why** · `splitQuery` spreads `prevState.queries[key].args.paginationOpts`, so a split page
  inherits both its start cursor and its `numItems` — React-v1 behaviour. Inheriting the cursor
  is what makes the port immune to the upstream bug fixed in 1.43.0
  ([§3.4](#34-upstream-fixes-the-translation-already-rules-out)).

#### Upstream defects not carried over

Upstream is wrong here, so the port does not copy it. Both must survive a sync; if upstream
fixes one, drop the entry rather than reverting.

##### D-08 — the JWT cache retries on auth errors; upstream retries on non-auth errors

- **Kind** · inverted predicate
- **Upstream** · `@convex-dev/better-auth@0.12.5` `nextjs/index.ts` — `callWithToken`
- **Port** · [`better-auth/nuxt/server.ts`](./src/runtime/better-auth/nuxt/server.ts)
- **Pinned by** · `test/unit/auth/nuxt/server.test.ts` — "refreshes the token once when jwt cache
  marks the first error as auth-related", "rethrows non-auth errors without refreshing even
  when the jwt cache is enabled"
- **On sync** · do **not** sync the condition back
- **Why** · upstream force-refreshes only when `jwtCache.isAuthError(error)` is **false** — it
  rethrows on auth errors and retries the ones a fresh token cannot help. The port retries
  exactly when the cached JWT is rejected as an auth error, which is what `isAuthError` exists
  for.

##### D-09 — `window.open` gains `noopener`

- **Kind** · security gap
- **Upstream** · `@convex-dev/polar@0.9.2` `react/index.tsx` — `window.open(url, '_blank')`
- **Port** · [`polar/vue/components.ts`](./src/runtime/polar/vue/components.ts) — `CheckoutLink`
- **Pinned by** · `test/nuxt/billing-components.test.ts`
- **On sync** · keep the third argument
- **Why** · unlike `<a target="_blank">`, `window.open` keeps `window.opener` live, letting the
  checkout tab navigate the opener. The forced `null` return is unused, so there is no cost.
  Not an open redirect: `url` is the app's own Convex action response.

#### Type and signature refinements

Declaration-level only. Code written against upstream's signature keeps compiling; what changes
is that the declaration now matches what actually happens.

##### D-10 — `TypeError` where upstream throws `Error`

- **Kind** · error subclass
- **Upstream** · `convex@1.45.0` `nextjs/index.ts` — deployment-URL validation
- **Port** · [`nuxt/index.ts`](./src/runtime/nuxt/index.ts)
- **Pinned by** · `test/unit/nuxt-server.test.ts` — "throws when no URL is available"
- **On sync** · keep the subclass; the **message text is the contract** and stays verbatim
- **Why** · `TypeError` is the accurate type and satisfies `unicorn/prefer-type-error`;
  `instanceof Error` still holds, so upstream-written `catch` blocks are unaffected.

##### D-11 — `usePreloadedAuthQuery` declares `| null | undefined`

- **Kind** · declaration widened to match runtime
- **Upstream** · `@convex-dev/better-auth@0.12.5` `nextjs/client.tsx` — declares `| null`
- **Port** · [`better-auth/vue/hydration.ts`](./src/runtime/better-auth/vue/hydration.ts)
- **Pinned by** · `test/nuxt/preload-hydration.test.ts` — "keeps auth-preloaded data while auth
  loads, then clears for unauthenticated users"
- **On sync** · keep the wider declaration
- **Why** · upstream declares `| null` but yields `undefined` at runtime for unauthenticated
  users. Declaring both keeps code annotated against upstream compiling *and* matches what
  actually arrives.

### 3.3 Port-only additions (`A-*`)

#### Vue/Nuxt ergonomics

Surface a Vue app expects and `convex/react` has no reason to ship.

##### A-01 — `useConvex*` aliases

- **Port** · [`vue/index.ts`](./src/runtime/vue/index.ts), below the "Vue-only additions" fence
- **Pinned by** · `test/nuxt/composables.test.ts`
- **Why** · every composable is auto-imported into the app's global scope, where `useQuery` and
  `useAction` can collide with other modules. Each ported composable gets a `useConvexQuery` /
  `useConvexMutation` / `useConvexAction` / `useConvexQueries` / `useConvexPaginatedQuery`
  alias; the upstream name stays primary.

##### A-02 — file-storage composables

- **Port** · [`vue/composables/use-upload.ts`](./src/runtime/vue/composables/use-upload.ts),
  `use-upload-queue.ts`, `use-storage-url.ts` — `useUpload`, `uploadFile`, `useUploadQueue`,
  `useStorageUrl` (+ `useConvex*` aliases)
- **Pinned by** · `test/unit/use-upload.test.ts`, `test/nuxt/use-storage.test.ts`
- **Why** · Convex file storage has a documented three-step flow but no client helpers in
  `convex/react`. These wrap it with progress, cancellation and queueing.

##### A-03 — the generated `api` object, reachable without importing it

- **Port** · [`vue/provide.ts`](./src/runtime/vue/provide.ts) — `provideConvexApi`, `useConvexApi`,
  `useConvexNamespace`, `ConvexApiKey`
- **Pinned by** · `test/nuxt/provide.test.ts`
- **Why** · `convex/_generated/api` lives at a path relative to the Convex directory, so every
  component that calls a function would otherwise carry its own `../../convex/_generated/api`
  import. Providing it once at app level and injecting it (`useConvexApi()`) removes that,
  and `useConvexNamespace('messages')` narrows to one module. React apps import it directly
  because they have no auto-import layer to be consistent with.

##### A-04 — `useAsyncQuery`

- **Port** · [`nuxt/composables/use-async-query.ts`](./src/runtime/nuxt/composables/use-async-query.ts)
  — `useAsyncQuery` / `useConvexAsyncQuery`, returning `{ data, error, status, refresh }`
- **Pinned by** · `test/nuxt/use-async-query.test.ts`
- **Why** · the Nuxt-idiomatic data layer: `useAsyncData`-style SSR fetch → payload hydration →
  live subscription upgrade. Lives under `runtime/nuxt/` (it imports `#app`) but deliberately
  **not** in the ported `nuxt/index.ts`, which maps file-for-file to `nextjs/index.ts`.

##### A-05 — one import path for every type an annotation needs

- **Port** · [`vue/index.ts`](./src/runtime/vue/index.ts)
- **Why** · typing Convex code means reaching into four upstream entry points, because
  `convex/react`'s index carries only some of what you need:

  | From | Types |
  |---|---|
  | `convex/browser` | `ConnectionState`, `OptimisticUpdate`, `QueryJournal` |
  | `convex/server` | `FunctionReference`, `FunctionArgs`, `FunctionReturnType`, `OptionalRestArgs`, `ArgsAndOptions` |
  | `convex/values` | `Value` |

  A React user imports each from where it lives, which is unremarkable — they are already
  writing imports. A Nuxt user is not: the module's whole surface is auto-imported, so a type
  that is *not* re-exported here is the one thing in a file that forces a hand-written import.
  All of the above are re-exported so that never happens.

  Three more are re-exported because they exist only in the port and have no upstream
  counterpart to import: `PaginatedWatch` (what `watchPaginatedQuery` returns), `ConvexLogger`
  (the type behind `ConvexVueClientOptions.logger`) and `VueMutationOptions` (N-02).

##### A-06 — `useAuth` service extensions

- **Port** · [`better-auth/vue/use-auth.ts`](./src/runtime/better-auth/vue/use-auth.ts)
- **Pinned by** · `test/unit/auth/vue/use-auth.test.ts`
- **Why** · beyond upstream's `{ isLoading, isAuthenticated, fetchAccessToken }`, the service
  exposes the raw `client`, the `session` ref, a `user` computed and an `authVersion` computed,
  plus the `AuthUser` / `UseAuthService` / `AuthSession` types. Auth *flows* (sign-in/out, OTP,
  passkeys, …) are deliberately **not** wrapped — like upstream, they are called on the app's
  own `authClient` (exposed as `client`), typed by whatever plugins that client installs.

#### Wiring and plumbing

The Nuxt analogs of what a React app assembles by hand, plus the types that assembly needs.

##### A-07 — Nuxt plugins in place of provider components

- **Port** · [`vue/plugin.ts`](./src/runtime/vue/plugin.ts),
  [`better-auth/vue/plugin.client.ts`](./src/runtime/better-auth/vue/plugin.client.ts),
  [`better-auth/vue/plugin.server.ts`](./src/runtime/better-auth/vue/plugin.server.ts)
- **Pinned by** · `test/unit/base-client-plugin.test.ts`, `test/unit/auth/vue/plugin-client.test.ts`, `test/nuxt/auth/vue/plugin-server-cache.test.ts`
- **Why** · the file-level counterpart of N-03 / N-04. `vue/plugin.ts` registers only when no
  auth integration owns the client. The client plugin deliberately does **not** tear down on
  `beforeunload` — that event is cancelable and fires before the user answers an
  unsaved-changes dialog, so closing there would drop in-flight mutations; upstream never
  closes on unload either.

##### A-08 — `createScopedConvexAuthState`

- **Port** · [`vue/auth/index.ts`](./src/runtime/vue/auth/index.ts)
- **Pinned by** · `test/unit/auth/vue/plugin-client.test.ts`
- **Why** · the `EffectScope`-wrapped variant of `createConvexAuthState`, so the Better Auth
  client plugin can dispose the auth watchers. React unmounts a component tree; Vue needs an
  explicit scope when the state is installed at app level.

##### A-09 — module wiring

- **Port** · [`src/module.ts`](./src/module.ts), [`src/functions-dir.ts`](./src/functions-dir.ts),
  [`nuxt/config.ts`](./src/runtime/nuxt/config.ts)
- **Pinned by** · `test/unit/module-options.test.ts`, `test/unit/aliases.test.ts`, `test/unit/functions-dir.test.ts`, `test/unit/diagnostics.test.ts`, `test/unit/convex-type-fallback.test.ts`
- **Why** · options, auto-imports, integration auto-detection, the `#convex/*` aliases and the
  generated-types fallback. Next apps wire Convex by hand.
- **Also** · the module resolves the deployment URL itself (`resolveDeploymentUrls`):
  `convex.url`, then `NUXT_PUBLIC_CONVEX_URL`, then the unprefixed `CONVEX_URL`. Upstream has
  no such step — a Next app reads `process.env.NEXT_PUBLIC_CONVEX_URL` at the call site, and the
  Convex CLI writes that name because its framework detection has a Next case. It has no Nuxt
  case, so for Nuxt the CLI writes `CONVEX_URL`; reading both is what lets a Convex user reach a
  working app without a `convex.url` line.

##### A-10 — types upstream keeps private

- **Port** · `IConvexVueClient` ([`vue/auth/index.ts`](./src/runtime/vue/auth/index.ts)),
  `UseAuth` ([`clerk/vue/index.ts`](./src/runtime/clerk/vue/index.ts)), `useConvexOrThrow`
  ([`vue/client.ts`](./src/runtime/vue/client.ts)), `usePreloadedPayload` / `useReactiveQuery`
  ([`vue/hydration.ts`](./src/runtime/vue/hydration.ts))
- **Why** · `IConvexVueClient` mirrors upstream's private `IConvexReactClient` but is exported,
  so wrappers and test doubles implementing only `setAuth`/`clearAuth` are accepted and the
  Auth0 adapter imports it instead of re-describing it. Clerk's `UseAuth` appears in the public
  `ConvexProviderWithClerkOptions`. The rest are `@internal` helpers shared across the files
  the port splits (N-12).

#### Security guards

Surfaces the port itself creates, and therefore has to close. None has an upstream counterpart,
so none can be "restored" by syncing.

##### A-11 — Convex-aware CSP and `nuxt-security` route rules

- **Port** · [`nuxt/csp.ts`](./src/runtime/nuxt/csp.ts), [`nuxt/security.ts`](./src/runtime/nuxt/security.ts)
- **Pinned by** · `test/unit/csp.test.ts`, `test/unit/security-plugin.test.ts`, `test/e2e/security-off.test.ts`
- **Why** · Convex needs its deployment origin in `connect-src` and its storage origin in the
  resource directives, or a default `nuxt-security` CSP silently breaks the app. `csp.ts` holds
  import-free pure helpers; `security.ts` is the Nitro plugin merging them into `nuxt-security`'s
  route rules. Registered only when the app has `nuxt-security` installed.

##### A-12 — `auth` route middleware and its redirect guard

- **Port** · [`better-auth/nuxt/middleware.ts`](./src/runtime/better-auth/nuxt/middleware.ts)
  (`serverGuard` + the `auth` route middleware),
  [`better-auth/vue/redirect.ts`](./src/runtime/better-auth/vue/redirect.ts) (`resolveAuthRedirect`)
- **Pinned by** · `test/unit/auth-redirect.test.ts`, `test/unit/auth/nuxt/middleware.test.ts`
- **On sync** · keep both, and keep the docs pointing login pages at `resolveAuthRedirect`
  rather than `route.query.redirect`
- **Why** · upstream ships no route middleware, so the convention is the port's — and so is the
  open-redirect surface its `?redirect=` query creates. `resolveAuthRedirect` closes it:
  same-origin paths pass; absolute, scheme-relative (`//host`), backslash (`/\host`),
  non-HTTP-scheme and repeated-parameter values fall back to the default.

##### A-13 — `crossDomainCallbackRoute` restricts `?ott=` exchange to one route

- **Port** · [`better-auth/vue/cross-domain.ts`](./src/runtime/better-auth/vue/cross-domain.ts) —
  `consumeCrossDomainOneTimeToken`'s optional `callbackRoute`, wired from the module option
  `convex.betterAuth.crossDomainCallbackRoute`
- **Pinned by** · `test/nuxt/auth/vue/cross-domain.test.ts` — "consumes the token on the
  configured callback route…", "scrubs but does not exchange the token outside the configured
  callback route", "warns instead of throwing when updating the session fails";
  `test/unit/auth/vue/plugin-client.test.ts` pins that it is off by default
- **On sync** · keep. Off by default, so upstream behaviour is the default
- **Why** · the token is exchanged on **any** URL, with no state or origin binding, so sign-in
  completes on whatever page receives it. The protocol deliberately is not bound to the initiating
  browser — magic-link flows finish in another browsing context, hence `skipStateCookieCheck`
  in the server plugin — so a client-side nonce would break legitimate flows. Restricting the
  exchange to one route is the additive mitigation. Three smaller guards sit alongside: an early
  return when the aliased client has no cross-domain plugin (upstream assumes it is installed);
  a catch so an exchange failure warns instead of breaking app startup; and `updateSession()`
  is **awaited**, where upstream fires and forgets. The catch is the reason: a promise nobody
  awaits escapes it and turns up as an unhandled rejection during startup, which is the exact
  failure the catch exists to prevent.

##### A-14 — the auth proxy route and its security rules

- **Port** · [`better-auth/nuxt/proxy.ts`](./src/runtime/better-auth/nuxt/proxy.ts) and
  `AUTH_PROXY_SECURITY_RULES` in [`src/module.ts`](./src/module.ts); the site-URL protocol guard
  in [`better-auth/nuxt/server.ts`](./src/runtime/better-auth/nuxt/server.ts)
- **Pinned by** · `test/e2e/better-auth-proxy.test.ts`
- **On sync** · `xssValidator: false` is **load-bearing** — do not "tidy" it away
- **Why** · the proxy delegates to `convexAuth(event).handler()`, which strips hop-by-hop
  headers and rewrites forwarded-host headers exactly as `convexBetterAuthNextJs` does; only
  the Nitro route registration is port-only. The route rules are what need justifying:
  `xssValidator: false` is a **correctness** fix, not hardening — `nuxt-security`'s validator
  HTML-escapes the JSON body and 400s when that changes anything, so a password containing `<`
  or `>` would never reach Better Auth. `allowedMethodsRestricter` pins the route to
  GET/HEAD/POST/OPTIONS. Both apply regardless of `convex.security`, since they concern the
  module's own route rather than the app's CSP. The site URL must parse as `http:`/`https:`
  before any request is made, because it is the only thing pinning the proxy's destination host.

#### Tooling

##### A-15 — Nuxt DevTools panel

- **Port** · `src/runtime/devtools/**`, `src/devtools/**`, `devtools-client-app/`
- **Pinned by** · `test/unit/devtools-bridge.test.ts`, `test/unit/devtools-setup.test.ts`, `test/unit/devtools-function-source.test.ts`
- **On sync** · the bridge reads client internals — see [§4](#4-keeping-parity)
- **Why** · dev-only query/mutation inspection. `runtime/devtools/bridge.ts` deliberately observes
  `ConvexVueClient` from the *outside* so `vue/client.ts` stays byte-diffable.

### 3.4 Upstream fixes the translation already rules out

Landed in mapped files, needed no code change, and are pinned by a test so a refactor cannot
reintroduce the bug. **Do not re-litigate.**

| Upstream | Commit | Why no port | Pinned by |
|---|---|---|---|
| `convex` 1.43.0 — `PaginatedQueryClient.splitPaginatedQueryPage` restarted the first half of a split page from `cursor: null`, duplicating items when a non-first page split | `7ceee3e` | The port's `splitQuery` inherits the split page's own cursor (D-07) | `test/nuxt/use-paginated-query.test.ts` — "splits a non-first page from that page's own cursor, not the start of the list" |
| `convex` 1.44.0 — `ConvexProviderWithAuth`'s context value wrapped in `useMemo` | `b96ea1b` | The port builds the state object once per `createConvexAuthState` call and carries reactivity in `ComputedRef`s, so its identity is already stable; the named locals mirror upstream's memo inputs for diffability | `test/unit/vue/convex-auth-state.test.ts` — "keeps the state object and its computed refs referentially stable across auth transitions" |
| `convex` 1.42.2 — `ConvexProviderWithClerk` ignored org-change deps `[orgId, orgRole, sessionId]` | — | The port's `authVersion` key (N-13) already keyed on those three values | `test/nuxt/auth/vue/clerk.test.ts` |

---

## 4. Keeping parity

The procedure — locating the upstream repository, diffing the mapped paths between two tags,
classifying each hunk, applying [§2.2](#22-translation-rules) — is the
[`upstream-parity` skill](./.agents/skills/upstream-parity/SKILL.md). It covers three jobs:
syncing a release, adding a ported symbol or a Vue-only extension, and recording a divergence.
What follows is the part that has to be *right* rather than merely followed.

### On every baseline bump

**Move the version everywhere it is stated**, or the docs ship a confidently wrong number.
`test/unit/upstream-baselines.test.ts` fails if any of the four drift apart; it parses this
file's table by row prefix, so keep [§1](#1-what-is-ported)'s row shape verbatim.

| # | Where | Form |
|---|---|---|
| 1 | [§1](#1-what-is-ported), first table | `**1.45.0**` in a table cell |
| 2 | [README.md](./README.md) "Supported official packages" | prose — `` `convex@1.45.0` `` |
| 3 | [`website/app/utils/upstream-baselines.ts`](./website/app/utils/upstream-baselines.ts) | the site's machine-readable copy (hero chip, introduction, component pages) |
| 4 | [`website/content/3.components/1.index.md`](./website/content/3.components/1.index.md) | last cell of each component row |

**Diff beyond the file map.** Code the port *re-implements* rather than mirrors has no mapped
counterpart, yet a fix there can still imply a fix here. For `convex` that is
`src/browser/sync` — home of `PaginatedQueryClient` (X-05). Diffing only the mapped paths would
have missed 1.43.0's `7ceee3e` ([§3.4](#34-upstream-fixes-the-translation-already-rules-out)).

**Re-check the internals the port reaches.** Each is declared as a local interface extension
rather than a cast at the use site, so a rename surfaces as a type error — but only if the
upstream change is noticed:

- `setAdminAuth` / `localQueryLogs` on `BaseConvexClient` (`vue/client.ts`); `setFetchOptions`
  / `setAdminAuth` on `ConvexHttpClient` (`nuxt/index.ts`); `paginationOptions` on
  `RequestForQueries` (`vue/queries-observer.ts`).
- The DevTools bridge (A-11) reads the TS-private `listeners` map and `cachedSync`,
  instance-patches `transition` / `close`, and reaches `localQueryResultByToken` and
  `optimisticQueryResults.queryLogs` on `BaseConvexClient`. Re-check against
  `browser/sync/client.ts`. The canary in `test/unit/devtools-bridge.test.ts` fails loudly on a
  rename; the worst case is a broken dev panel, never a broken app — every access is
  optional-chained.
- Types derived locally because upstream imports them from a non-exported path
  (`PaginatedQueryResult`, `SubscribeToPaginatedQueryOptions`, `EmptyObject`,
  `LoadMoreOfPaginatedQuery`, `validateDeploymentUrl`). If upstream ever exports them properly,
  switch to the import (N-13).

**Mirror a moved peer range twice.** `@convex-dev/better-auth@0.12.5` peers
`better-auth >=1.6.11 <1.7.0`; `package.json` mirrors that and `.github/dependabot.yml` holds
Dependabot below 1.7. Both move only when the add-on's own peer range does.

### The gate

```bash
pnpm dev:prepare    # build the module stub + prepare Nuxt
pnpm lint
pnpm test:types     # vue-tsc (lib + website)
pnpm test           # vitest: unit + nuxt projects
pnpm test:quality   # fallow: unused exports, duplication, file-health
```

### History

| Date | Package | From → To | Commit | What was ported |
|---|---|---|---|---|
| 2026-09-01 | `convex` | 1.42.3 → 1.45.0 | `8a5db10` | Nothing — both upstream fixes ruled out ([§3.4](#34-upstream-fixes-the-translation-already-rules-out)). Two pinning tests added; `better-auth` peer range mirrored |
| 2026-07-28 | `convex` | → 1.42.3 | `aebe1ff` | Clerk adapter change (org-change deps → `authVersion`) |
| 2026-07-28 | `@convex-dev/better-auth` | → 0.12.5 | `aebe1ff` | Initial pin |
| 2026-07-28 | `@convex-dev/polar` | → 0.9.2 | `aebe1ff` | Initial pin |
