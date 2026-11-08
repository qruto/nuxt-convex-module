# Upstream parity manifest

`nuxt-convex-module` is a **faithful Vue/Nuxt port** of Convex's own client code, kept
**diffable against upstream** so each release can be tracked file-for-file. This file is the
contract and the ledger: what is ported, the rules it is held to, every place it deliberately
bends, and what moves on a sync. The sync procedure itself is the
[`upstream-parity` skill](./website/skills/upstream-parity/SKILL.md); repository conventions
are in [AGENTS.md](./AGENTS.md).

---

## 1. What is ported

| Upstream package | Baseline version | Diffed against |
|---|---|---|
| `convex` (`/react`, `/nextjs`, `/react-clerk`, `/react-auth0`) | **1.49.0** | tag `npm/1.49.0` in [convex/convex-js](https://github.com/convex/convex-js) |
| `@convex-dev/better-auth` | **0.13.0** | tag `v0.13.0` in [convex/better-auth](https://github.com/convex/better-auth) |
| `@convex-dev/polar` | **0.9.2** | tag `v0.9.2` in [convex/polar](https://github.com/convex/polar) |

A baseline is the version the ported files were diffed against — not what a consumer may
install, which is the wider `peerDependencies` range in `package.json`.

The port draws on two distinct upstream sources, pinned separately.

### Convex's own client

The framework integrations Convex ships **inside the `convex` package**. All four are ported in
full, always part of the module, and covered by the one `convex` baseline.

| Upstream entry point | Ported to | Status |
|---|---|---|
| [`convex/react`](https://docs.convex.dev/client/react) — the client, every hook, auth state, helper components | `src/runtime/vue/**` | Complete + additive · D-01, D-02, D-05, D-06, D-07, F-03 |
| [`convex/nextjs`](https://docs.convex.dev/client/react/nextjs/server-rendering) — `fetchQuery` / `fetchMutation` / `fetchAction`, `preloadQuery` | `src/runtime/nuxt/index.ts` | Complete + additive · D-10, D-17 |
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
| `@convex-dev/better-auth` — `react` client | `src/runtime/better-auth/vue/**` | Complete + additive · D-03, F-04 |
| `@convex-dev/better-auth` — `nextjs` server helpers | `src/runtime/better-auth/nuxt/**` | Complete + additive · D-04, D-17, F-01 |
| `@convex-dev/better-auth` — client plugins (`convexClient`, `crossDomainClient`) | imported as-is from `@convex-dev/better-auth/client/plugins` | Reused, never reimplemented |
| `@convex-dev/better-auth` — `react-start` | — | Out of scope (X-02) |
| `@convex-dev/polar` — `react` components | `src/runtime/polar/vue/components.ts` | Complete + additive · F-02 |
| `@convex-dev/resend` | — | Out of scope (X-01) — ships no client |

**Status** · *Complete*: the whole public surface, same names, same arguments, same return
shapes; the only differences are shape changes [§2.2](#22-translation-rules) sanctions.
*+ additive*: plus Vue/Nuxt extras upstream lacks ([§3.3](#33-port-only-additions-a-)); nothing
upstream ships is missing or renamed. *D-nn*: the port deliberately *behaves* differently
there, each explained in [§3.2](#32-behaviour-d-). *F-nn*: the port fixes an upstream bug there,
each explained in [§3.5](#35-upstream-bugs-fixed-in-the-port-f-).

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

Verified `@internal` claims above are against the *published* `.d.ts` of convex 1.49.0, not the
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
| better-auth `react/index.tsx` — `AuthBoundary`, provider's `useUseAuthFromBetterAuth` | `better-auth/vue/{auth-boundary,plugin.client,plugin.server,token-store,use-better-auth}.ts` |
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
| `vue/plugin.ts`, `better-auth/vue/plugin.{client,server}.ts` | Nuxt plugins standing in for provider components | A-07 |
| `nuxt/composables/use-async-query.ts`, `nuxt/app.ts` | `useAsyncQuery` and its `nuxt-convex-module/app` barrel | A-04 |
| `nuxt/function-name.ts` | names the function in a server fetch error, and gives F-01's check the message without it | D-17 |
| `nuxt/testing.ts` | the `nuxt-convex-module/testing` barrel: resets the state the Better Auth integration keeps for the app's lifetime, for an app's own tests | A-18 |
| `nuxt/composables/use-async-paginated-query.ts` | `useAsyncPaginatedQuery` — the paginated `useAsyncQuery` | A-16 |
| `vue/components/convex-image.ts` | `<ConvexImage>` over `useStorageUrl` | A-17 |
| `nuxt/csp.ts`, `nuxt/security.ts` | Convex-aware CSP + `nuxt-security` route rules | A-11 |
| `nuxt/config.ts`, `src/module.ts`, `src/functions-dir.ts` | module wiring | A-09 |
| `runtime/devtools/**`, `devtools/**`, `devtools-client-app/` | DevTools panel (dev-only) | A-15 |
| `better-auth/nuxt/middleware.ts`, `better-auth/nuxt/server-guard.ts`, `better-auth/vue/redirect.ts` | `convex-auth` route middleware + its redirect guard | A-12 |
| `better-auth/nuxt/proxy.ts` | the `${betterAuth.authRoute}/**` server handler | A-14 |
| `better-auth/vue/auth-client-loader.ts` | loads `#convex/auth-client` on first use: `loadAuthClient`, and the forwarding client `useBetterAuth().client` holds until then | D-18 |

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
| `useEffect` (never runs during SSR) | `if (!import.meta.server) watch(…)` — the **negative** guard. In a plain Vue app neither `import.meta.client` nor `import.meta.server` is defined, so `import.meta.client && …` fails closed and the effect never runs; `!import.meta.server` fails open. Pinned by the `plain-vue` vitest project |
| `setState(updater)` functional update | `state.value = updater(state.value)` — keep upstream's module-level curried updaters as-is (see `splitQuery` / `completeSplitQuery`) |
| Static hook arguments | `MaybeRefOrGetter` inputs, read via `toValue` |
| Returns a plain value | Returns `ComputedRef` / `ShallowRef` (VueUse convention) |
| JSX helper components (`<Authenticated>`, …) | `/* @__PURE__ */ defineComponent(…)` render functions in `vue/auth/helpers.ts`. The annotation lets a bundler drop an unused component; a module-scope call is otherwise kept, because Rolldown doesn't apply Vue's own `@__NO_SIDE_EFFECTS__` marker across modules. Every module-scope `defineComponent` in the runtime carries it |
| Function-component name (automatic in React) | Explicit `name:` option — a plain-`.ts` `defineComponent` is otherwise `<Anonymous>` in devtools/warnings |
| `{ children: ReactNode }` typing | Nothing — Vue components accept a default slot implicitly; do **not** add `slots: SlotsType<…>` declarations |
| Next.js server helpers (`preloadQuery`, `fetchQuery`, …) | Nitro server utils in `nuxt/index.ts` (auto-imported on the server); helper names stay verbatim |
| Framework-qualified names (`NextjsOptions`, `convexBetterAuthNextJs`) | Substitute the framework part only: `NuxtOptions`, `convexBetterAuthNuxt` |
| Ambient per-request context (`next/headers` + `React.cache`) | Explicit `event` parameter, the `nuxt/server` event or the h3 one (Nitro has no ambient request context) |
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
| `test/unit/upstream-baselines.test.ts` | a baseline bump misses one of the three version sites ([§4](#4-keeping-parity)) |
| `test/unit/parity-manifest.test.ts` | this file stops describing the source tree — a runtime file with no row, a mapped path that no longer exists, a `PARITY:` marker with no entry, a `D-*` or `F-*` entry with no marker, a cited test that is gone |
| `test/unit/devtools-bridge.test.ts` | an upstream sync renames a client internal the DevTools bridge reads |

---

## 3. Where the port bends

Every deliberate difference from upstream, and every upstream bug the port fixes, has a stable
ID here, a `PARITY: <ID>` comment marker at the source site, and a named test that pins it.
Entries are grouped by *kind*, because that is what decides how to treat one on a sync.

- **`N-*` — naming and shape.** Vue expresses the same thing differently; behaviour is
  unchanged. Each cites the [§2.2](#22-translation-rules) rule that sanctions it.
- **`D-*` — behaviour.** The port deliberately does something upstream does not. Each says why,
  and what to do on the next sync.
- **`A-*` — port-only additions.** No upstream origin. Strictly additive; never "sync away".
- **`F-*` — upstream bugs fixed.** Upstream's code is wrong, and the port does the correct thing.
  Each links its upstream report; the entry goes away once upstream ships the fix.

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
| <a id="n-09"></a>**N-09** | better-auth `convexSiteUrl`, required | Optional; falls back to runtime config / `NUXT_PUBLIC_CONVEX_SITE_URL` | [§2.1](#21-the-contract): a required option may become optional with an auto-provided default. An upstream call site passing it behaves identically, and a missing value still throws. Its sibling `convexUrl` is accepted and ignored — upstream requires but never reads it either. Pinned by `test/unit/auth/nuxt/server.test.ts` |
| <a id="n-10"></a>**N-10** | `useAuthFromBetterAuth` | `useBetterAuth` | The provider prop it fed does not exist here; the service is consumed directly |
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
- **Upstream** · `convex@1.49.0` `react/use_subscription.ts`, `react/use_queries.ts`, `react/ConvexAuthState.tsx` — all subscribe inside `useEffect`
- **Port** · [`vue/composables/use-subscription.ts`](./src/runtime/vue/composables/use-subscription.ts), [`vue/composables/use-queries.ts`](./src/runtime/vue/composables/use-queries.ts), [`vue/auth/index.ts`](./src/runtime/vue/auth/index.ts)
- **Pinned by** · `test/unit-server/ssr-subscription-guard.test.ts`, `test/unit-server/ssr-auth-guard.test.ts`
- **On sync** · keep every `import.meta.server` short-circuit
- **Why** · `onCleanup` never fires during SSR setup, so without the guard each request would
  open a WebSocket on the server that nothing closes. The render-time reads upstream performs
  (`getLocalResults`, the initial `getCurrentValue()`) still happen.

##### D-02 — `useQuery` returns a lazy computed that throws when read

- **Kind** · a composable body runs once — there is no render phase to throw in
- **Upstream** · `convex@1.49.0` `react/client.ts` — `useQuery` throws inside the hook call
- **Port** · [`vue/composables/use-query.ts`](./src/runtime/vue/composables/use-query.ts)
- **Pinned by** · `test/unit/use-query.test.ts`, `test/nuxt/auth/vue/auth-boundary.test.ts`
- **On sync** · keep. Knock-on: `AuthBoundary` must read `user.value` during render, where
  upstream discards the hook result because its throw already happened
- **Why** · the error surfaces when `.value` is read during render and propagates to the nearest
  `errorCaptured` boundary — React's `<ErrorBoundary>` analog. The same rule is why the
  paginated-query shapers check the internal `'Error'` variant per field: a computed whose
  getter throws serves its stale cached value to the next dependent read.

##### D-03 — `isAuthenticated` counts session data without a nested `session`

- **Kind** · a wider reading of Better Auth's session data
- **Upstream** · `@convex-dev/better-auth@0.13.0` `react/index.tsx` — `Boolean(session?.session) || isSsrTokenActive`
- **Port** · [`better-auth/vue/use-better-auth.ts`](./src/runtime/better-auth/vue/use-better-auth.ts)
- **Pinned by** · `test/unit/auth/vue/use-better-auth.test.ts` — "treats a settled missing session as
  unauthenticated even with a stale cached token", "does not bring a token back when a signed-out
  session refetches"
- **On sync** · keep the predicate; port changes to the *inputs*, not the shape
- **Why** · Better Auth session data without a nested `session` object still means signed in, which
  `session?.session` misses. The port's `isServerTokenActive` is upstream's `isSsrTokenActive`: it
  counts only the prefetched token, and only while the session is pending. Upstream drops that token
  in an effect once the session loads; the port drops it in a synchronous watcher when the session
  settles signed out, so a refetch that reads pending again cannot bring it back.

##### D-04 — stale `Content-Encoding` / `Content-Length` and hop-by-hop headers are stripped from the proxied response

- **Kind** · undici decompresses transparently but leaves the headers describing the compressed body;
  the upstream connection's hop-by-hop headers describe the Convex leg, not the relayed reply
- **Upstream** · `@convex-dev/better-auth@0.13.0` `nextjs/index.ts` — `return fetch(nextUrl, init)`
- **Port** · [`better-auth/nuxt/server.ts`](./src/runtime/better-auth/nuxt/server.ts) — `handler`
- **Pinned by** · `test/unit/auth/nuxt/server.test.ts` — "strips stale content-encoding/length
  from the proxied response" and "drops the upstream connection's hop-by-hop headers from the proxied
  response, and keeps the rest"
- **On sync** · keep; forwarding these headers verbatim is a correctness bug here
- **Why** · relaying the encoding headers makes the browser decode an already-decoded response
  (`ERR_CONTENT_DECODING_FAILED`). Relaying the hop-by-hop headers (RFC 9110 §7.6.1 forbids a
  proxy to) broke every second `/api/auth/*` request in `nuxt dev` when the client sends
  `Connection: close`, as portless always does. Convex's `Connection: keep-alive` keeps the Nitro
  worker's socket open after Node has stopped reading it, Nitro's dev proxy reuses that socket from
  its keep-alive pool, and the worker answers 400 (`HPE_CLOSED_CONNECTION`). The fixed hop-by-hop
  set and any header the upstream `Connection` names are dropped. Every other header is preserved,
  `Set-Cookie` and `Location` included.

##### D-13 — a server render reads its own token store and a pending session

- **Kind** · React state is per render; a Vue composable's module scope is per Nitro process
- **Upstream** · `@convex-dev/better-auth@0.13.0` `react/index.tsx` — `useState(...)` for the SSR token inside
  `useUseAuthFromBetterAuth`, and better-auth's `useSession()` store
- **Port** · [`better-auth/vue/use-better-auth.ts`](./src/runtime/better-auth/vue/use-better-auth.ts) —
  `useTokenStore`, `serverSession`; [`better-auth/vue/token-store.ts`](./src/runtime/better-auth/vue/token-store.ts) —
  the store; [`better-auth/vue/plugin.server.ts`](./src/runtime/better-auth/vue/plugin.server.ts)
  provides each request's store and seeds it with the prefetched token
- **Pinned by** · `test/unit-server/ssr-better-auth.test.ts`, `test/unit/auth/vue/plugin-server.test.ts` —
  "hands the prefetched token to the token store of this request", `test/e2e/ssr-auth.test.ts`
- **On sync** · keep; port changes to how upstream seeds or clears its token into the store
- **Why** · upstream's provider holds the prefetched token in state of its own, so a signed-in
  visitor's server render already reads authenticated. Kept at module scope, the token could not
  reach a server render without reaching every visitor's, so the server rendered signed-in visitors
  as loading while the browser hydrated them signed in: a hydration mismatch Vue leaves in the DOM.
  The browser runs one app, so its store stays at module scope; each server request gets its own.
  Better Auth's session store never fetches on the server, so it reads pending for the whole
  render, but it is one store for every request, and subscribing to it in a component scope no
  server render disposes kept one listener per call, for good. A server render reads the same
  pending state from a ref of its own.

##### D-14 — a server render opens no WebSocket, and its client is closed after the request

- **Kind** · a Nitro process renders every request with a client of its own; React renders one app
- **Upstream** · `convex@1.49.0` `react/client.ts` — `connectionState()` reads `this.sync`, which
  creates the WebSocket client
- **Port** · [`vue/client.ts`](./src/runtime/vue/client.ts) — `connectionState()`;
  [`nuxt/config.ts`](./src/runtime/nuxt/config.ts) — `closeAfterRender`, called by
  [`vue/plugin.ts`](./src/runtime/vue/plugin.ts) and
  [`better-auth/vue/plugin.server.ts`](./src/runtime/better-auth/vue/plugin.server.ts)
- **Pinned by** · `test/unit-server/ssr-convex-client.test.ts`, `test/e2e/basic.test.ts` —
  "server-renders the connection state without opening a socket"
- **On sync** · keep both
- **Why** · `useConvexConnectionState()` reads the state once during setup (D-01 keeps that read),
  and upstream's `connectionState()` creates the sync client to answer, which connects from its
  constructor. Each server render then opened a WebSocket to the deployment, and nothing closed
  the per-request client, so the sockets stayed open: memory and connections grew with traffic,
  and `nuxt generate` could not exit. A server render now reports a connection not yet made, the
  state the browser's client starts in, and each request's client is closed once the page is
  rendered or the request fails.

##### D-16 — only the latest token request writes the cache

- **Kind** · one token store where upstream keeps the SSR token in state of its own
- **Upstream** · `@convex-dev/better-auth@0.13.0` `react/index.tsx` — `fetchAccessToken`, which caches
  every answer under the session it was asked for
- **Port** · [`better-auth/vue/use-better-auth.ts`](./src/runtime/better-auth/vue/use-better-auth.ts) — `isLatest`
- **Pinned by** · `test/unit/auth/vue/use-better-auth.test.ts` — "ignores a token that arrives after
  the session signed out", "keeps sharing the newest request when an older one finishes first"
- **On sync** · keep while the prefetched token and fetched tokens share one store
- **Why** · a token fetched while the session is pending carries the pending version, the one
  `isServerTokenActive` trusts. Left to land after the session settled signed out, it would read as
  signed in on the next refetch. Upstream's fetched tokens can't reach `isSsrTokenActive`.

##### D-15 — `clearAuth` and the next `setAuth` wait for the flush

- **Kind** · a Vue watcher has no first-child and last-child effect order
- **Upstream** · `convex@1.49.0` `react/ConvexAuthState.tsx` — `ConvexAuthStateFirstEffect`,
  `ConvexAuthStateLastEffect`
- **Port** · [`vue/auth/index.ts`](./src/runtime/vue/auth/index.ts) — `clearAuthLast`
- **Pinned by** · `test/nuxt/vue/convex-auth-state.test.ts` — "clears auth after the queries gated on
  it have left", `test/unit/vue/auth-over-socket.test.ts`
- **On sync** · keep; port changes to what the effects depend on
- **Why** · `clearAuth` makes the server re-run every subscribed query signed out, so upstream runs
  it from a last child, after its siblings' queries unsubscribe. A watcher can't sit after its
  children: it runs first, so the port waits for the flush, and a registration made in that flush
  waits behind the clear, in upstream's order. Don't skip the clear to save the wait: `setAuth`
  pauses the socket, and if the new token never comes, a clear sent while paused is dropped and
  the server keeps the old identity.

##### D-18 — the Better Auth client loads on first use

- **Kind** · a client upstream's app builds at import, here behind a dynamic import
- **Upstream** · `@convex-dev/better-auth@0.13.0` `react/index.tsx` — `ConvexBetterAuthProvider` takes the `authClient` the
  app created at module scope, and `useUseAuthFromBetterAuth` calls `authClient.useSession()` and `authClient.convex.token()`
- **Port** · [`better-auth/vue/auth-client-loader.ts`](./src/runtime/better-auth/vue/auth-client-loader.ts) —
  `loadAuthClient`, `lazyAuthClient`, `deferAuthClient`;
  [`better-auth/vue/use-better-auth.ts`](./src/runtime/better-auth/vue/use-better-auth.ts) — the mirrored session,
  `settleSessionWithoutClient`, the token request; [`better-auth/vue/cross-domain.ts`](./src/runtime/better-auth/vue/cross-domain.ts);
  [`better-auth/vue/plugin.client.ts`](./src/runtime/better-auth/vue/plugin.client.ts) and
  [`better-auth/vue/plugin.server.ts`](./src/runtime/better-auth/vue/plugin.server.ts) — the no-session flag, `isSharedRender`;
  [`better-auth/nuxt/middleware.ts`](./src/runtime/better-auth/nuxt/middleware.ts) — a guarded route loads the client;
  [`src/auth-client-registration.ts`](./src/auth-client-registration.ts) — `keepAuthClientOffPrefetch` and
  `registerAuthClientOnEvaluation`, called from [`src/module.ts`](./src/module.ts)
- **Pinned by** · `test/unit/auth/vue/auth-client-loader.test.ts` (among them "keeps a client module that ran during the
  deferral unused, until Better Auth signals a session change", "keeps the server's token after a second failure, and asks
  again when the browser is back online", "tells every listener when one throws, and
  stays loaded", "follows a client that a static import evaluated, with no call through the loader", "keeps a settled
  session settled while the client's store reads pending, then follows its answer", "settles the session signed out, with
  the error, after a second failure", "answers useSession(useFetch) with a promise, as Better Auth does, not a pending ref",
  "returns from a refetch whose hook never followed, instead of calling itself", "calls a method read off the loaded client
  with the client as this", "keeps a store subscription made before the load through a failed load", "answers a hook with
  the error when its load fails twice, and stops waiting when its scope ends", "lets a guarded route wait out a failed first
  load that the retry recovers", "tries again on the next visit to the tab
  after a failed load", "answers a store subscription made before the load with an unsubscribe that works at once", "asks
  the client for a forced token request on a session settled without it", "waits for the client's own answer before a
  guarded route decides"), `test/unit/auth-client-registration.test.ts` — "matches a posix manifest key against a Windows
  target and root", "matches an alias that names a directory, by the index file it resolves to", "matches an alias
  under a symlinked root, by the real path Vite transforms", `test/unit/auth/nuxt/middleware.test.ts` — "decides
  on the client's answer, not on a session settled without it", "lets a visitor the server's token covers through when the
  client cannot load", `test/unit/auth/vue/plugin-client.test.ts` — "loads it at
  startup for a cross-domain session kept in sessionStorage", `test/nuxt/auth/vue/cross-domain.test.ts` — "scrubs the token
  from the address before the client loads", "keeps the token when the client cannot load, and exchanges it once the client
  arrives", "does not let a kept token replace a session started since",
  `test/unit/auth/vue/plugin-server.test.ts` — "stays off on a render a %s route rule may serve to others", "stays off on the
  render Nitro's cached handler makes", "is taken back when the page sets a shared caching header as it renders", "stays off on a render whose %s lets a shared cache keep it", `test/unit/auth/vue/use-better-auth.test.ts` — "exposes the
  Better Auth client and session from one service", `test/e2e/lazy-auth-client.test.ts` — "follows a statically imported
  client through a sign-in to a guarded page", "loads at startup on an swr page, whose render other visitors are served",
  "asks nothing of the server when a link prefetches a page that imports the client"
- **On sync** · keep; port changes to how upstream reads the session or the token onto the loaded client
- **Why** · a Nuxt plugin runs on every page, so a client the plugin imports is in the entry chunk of every
  page: 28 to 42 KB of the fixture's entry (`test/fixtures/lazy-auth`), more with an app's plugins. The runtime
  reaches `#convex/auth-client` only through `import()`, so the module behind the alias, and with it the
  one instance, is unchanged. Until it loads, the session reads pending, as Better Auth's store reads before
  its first fetch, so hydration matches the server render; `useBetterAuth().client` is a forwarding client
  whose calls wait for the load and whose `use*` hooks answer with a pending ref that follows the real one. The server plugin flags a request that carried no session cookie and got no
  token; there the browser waits for a first use (a call, a token request, a guarded route, the tab coming
  back into view) and settles the session signed out after hydration, so a page that never needs the
  client never downloads it. A `?ott=` token or a session the cross-domain plugin saved in storage loads it
  at startup, and the chunk is kept off Nuxt's prefetch list. An app that imports `authClient` statically
  opts that page back in: the browser build appends a line to the client module that hands the client to the
  loader as it evaluates, so the session follows it either way. The flag is never set on a render other
  visitors may be served (Nitro's cached handler marks the render, a `cache`, `swr`, `isr` or `prerender` rule
  matches in Nitro's own rules, or a caching header lets a shared cache keep it): the cached handler renders
  without the cookie, so a cached render always looks signed out. `getRouteRules()` from `#app` is not read:
  Nuxt folds the caching rules into `payload` there. A client module that merely ran while the load waits (a
  `<NuxtLink>` prefetching a page that imports it) is kept unused until a first use or a session signal. A
  settled session stays settled while the client's store reads pending before its first answer, and a chunk
  that fails to load is asked for once more, then the session settles signed out with the error, unless the
  server's token still covers it; the chunk is asked for again when the browser is back online or the tab
  back in view. The deferral only runs on Vite, where the registration transform sees a static import; on
  webpack or rspack the client loads at startup as before. A flag set before a page sets a caching header is
  taken back on `app:rendered`, before the payload is written. A method read off the forwarding client is
  called with the real client as `this`; a subscription or hook made before the load waits through failed
  loads, and a hook stops waiting when its scope ends. A session settled
  without the client is the server's word, which a sign-in since then outdates: a guarded route and a forced
  token request wait for the client's own answer. A `?ott=` token leaves the address before the chunk is
  fetched, and waits in memory when the chunk cannot load.

#### Consequences of an unimportable upstream internal

All three follow from `PaginatedQueryClient` being unreachable ([X-05](#x-05--paginatedqueryclient)).
The port re-implements page management from `react/use_paginated_query.ts` instead, so anything
upstream routes through that client has to land somewhere else here.

##### D-05 — `watchPaginatedQuery` throws instead of returning a watch

- **Upstream** · `convex@1.49.0` `react/client.ts` — `ConvexReactClient.watchPaginatedQuery`
- **Port** · [`vue/client.ts`](./src/runtime/vue/client.ts) — `ConvexVueClient.watchPaginatedQuery`
- **Pinned by** · `test/unit/client.test.ts` — "watchPaginatedQuery"
- **On sync** · keep the throw; port page-management changes into `use-paginated-query.ts`
- **Why** · upstream's method only hands work to `PaginatedQueryClient`. It is retained for
  structural parity and throws loudly rather than silently mis-subscribing. Like upstream's, it
  is `@internal`: present at runtime, absent from the published types (`stripInternal`).

##### D-06 — the sync client's transition callback is wired directly

- **Upstream** · `convex@1.49.0` `react/client.ts` — the `BaseConvexClient` construction in `get sync()`
- **Port** · [`vue/client.ts`](./src/runtime/vue/client.ts) — `cachedSync`
- **Pinned by** · `test/unit/client.test.ts`
- **On sync** · keep; re-check if upstream stops routing transitions through `PaginatedQueryClient`
- **Why** · upstream passes a no-op handler and routes every transition through the internal
  client. Without it, the callback goes straight to `transition()`.

##### D-07 — split pages inherit the split page's `paginationOpts`

- **Upstream** · `convex@1.49.0` `browser/sync/paginated_query_client.ts` — `splitPaginatedQueryPage` resets `numItems` to `initialNumItems`
- **Port** · [`vue/composables/use-paginated-query.ts`](./src/runtime/vue/composables/use-paginated-query.ts) — `splitQuery`
- **Pinned by** · `test/nuxt/use-paginated-query.test.ts` — "page split", "splits a non-first
  page from that page's own cursor, not the start of the list"
- **On sync** · keep
- **Why** · `splitQuery` spreads `prevState.queries[key].args.paginationOpts`, so a split page
  inherits both its start cursor and its `numItems` — React-v1 behaviour. Inheriting the cursor
  is what makes the port immune to the upstream bug fixed in 1.43.0
  ([§3.4](#34-upstream-fixes-the-translation-already-rules-out)).

#### Type and signature refinements

Declaration-level only. Code written against upstream's signature keeps compiling; what changes
is that the declaration now matches what actually happens.

##### D-10 — `TypeError` where upstream throws `Error`

- **Kind** · error subclass
- **Upstream** · `convex@1.49.0` `nextjs/index.ts` — deployment-URL validation
- **Port** · [`nuxt/index.ts`](./src/runtime/nuxt/index.ts)
- **Pinned by** · `test/unit/nuxt-server.test.ts` — "throws when no URL is available"
- **On sync** · keep the subclass; the **message text is the contract** and stays verbatim
- **Why** · `TypeError` is the accurate type and satisfies `unicorn/prefer-type-error`;
  `instanceof Error` still holds, so upstream-written `catch` blocks are unaffected.

#### Diagnostics

What an error says, never what it is: the class, `data` and identity stay upstream's.

##### D-17 — server fetch errors name the function they ran

- **Kind** · a message prefix, in the form the browser client already writes
- **Upstream** · `convex@1.49.0` `nextjs/index.ts` — `fetchQuery`, `fetchMutation`, `fetchAction` return
  `ConvexHttpClient`'s promise as it is
- **Port** · [`nuxt/function-name.ts`](./src/runtime/nuxt/function-name.ts) — `withFunctionName`, called by the three
  helpers in [`nuxt/index.ts`](./src/runtime/nuxt/index.ts); `withoutFunctionName`, called by F-01's retry in
  [`better-auth/nuxt/server.ts`](./src/runtime/better-auth/nuxt/server.ts)
- **Pinned by** · `test/unit/nuxt-server.test.ts` — "fetchQuery names the function in the error it rethrows,
  as the browser client does" (and its mutation and action rows), "leaves an error that already names
  its function alone", "rewrites the stack's header, not the first match of the message", "rethrows an error whose
  message cannot be written untouched", "rethrows a value
  that is not an Error untouched"; `test/unit/auth/nuxt/server.test.ts` — "checks for an auth error on the
  message without the function name"
- **On sync** · keep; port changes to the calls, and drop the entry if `ConvexHttpClient` starts naming
  the function itself
- **Why** · the browser client prefixes every failure with `[CONVEX Q(module:fn)]`
  (`browser/logging.ts` — `createHybridErrorStacktrace`), so a report says which call failed. The HTTP
  client names nothing, and a failed server render or route read only `Server Error`. The prefix goes
  on the error that was thrown, not a wrapper: a `ConvexError` keeps its class and `data`. F-01's
  `jwtCache.isAuthError(error)` gets that same object, showing the message the server sent while it runs
  (the prefix comes off and goes back on after), so the function's path never decides the retry: `/auth/i`
  against `[CONVEX A(auth:sendWelcome)] …` would re-run any failed action under `auth/`. An error whose
  message cannot be written (a `DOMException`, whose `message` is a getter) is rethrown as it was.

### 3.3 Port-only additions (`A-*`)

#### Vue/Nuxt ergonomics

Surface a Vue app expects and `convex/react` has no reason to ship.

##### A-01 — `useConvex*` aliases

- **Port** · [`vue/index.ts`](./src/runtime/vue/index.ts), below the "Vue-only additions" fence
- **Pinned by** · `test/nuxt/public-surface.test.ts` — the `useConvex*` names in the `./client` literal; `test/module/registration.test.ts` — the exact auto-import set on a loaded Nuxt
- **Why** · every composable is auto-imported into the app's global scope, where `useQuery` and
  `useAction` can collide with other modules. Each ported composable gets a `useConvexQuery` /
  `useConvexMutation` / `useConvexAction` / `useConvexQueries` / `useConvexPaginatedQuery`
  alias; the upstream name stays primary.

##### A-02 — file-storage composables

- **Port** · [`vue/composables/use-upload.ts`](./src/runtime/vue/composables/use-upload.ts),
  `use-upload-queue.ts`, `use-storage-url.ts` — `useUpload`, `uploadFile`, `useUploadQueue`,
  `useStorageUrl` (+ `useConvex*` aliases)
- **Pinned by** · `test/unit/use-upload.test.ts`, `test/nuxt/use-storage.test.ts` — the `useUploadQueue hooks` cases
  pin `prepare`, `after`, refused against failed, and `retry`; "hands a storage id after refused to
  onItemError, and a retry forgets it", "retry after onItemSuccess threw runs only onItemSuccess, never
  after twice", "settles an item as failed when isRefusal throws" and "keeps a retry started from
  onItemError abortable" pin the edges
- **Why** · Convex file storage has a documented three-step flow but no client helpers in
  `convex/react`. These wrap it with progress, cancellation and queueing.
  `useUploadQueue`'s `prepare` and `after` hooks put an app's own steps on either side of the
  transfer (shrink a photo before it leaves; attach and check it once stored), and the item stays
  `uploading` until both settle. A failed item says whether it was `refused`, the app turning the
  file away (`isRefusal`, by default a `ConvexError`), or failed, so a UI can show the reason for
  one and offer a retry for the other. `retry` resumes from the step that stopped and never
  runs a finished `after` twice; a file `after` refused stays on `item.storageId` for the app to
  delete (the queue never deletes files) until a retry sends the file again. An app
  otherwise hand-rolls the whole queue to get any of this.

##### A-04 — `useAsyncQuery`

- **Port** · [`nuxt/composables/use-async-query.ts`](./src/runtime/nuxt/composables/use-async-query.ts)
  — `useAsyncQuery` / `useConvexAsyncQuery`, returning `{ data, error, status, refresh }`;
  exported from [`nuxt/app.ts`](./src/runtime/nuxt/app.ts) as the `nuxt-convex-module/app` subpath
- **Pinned by** · `test/nuxt/use-async-query.test.ts`, `test/nuxt/public-surface.test.ts`,
  `test/e2e/hydration-recovery.test.ts`
- **Why** · the Nuxt-idiomatic data layer: `useAsyncData`-style SSR fetch → payload hydration →
  live subscription upgrade. Lives under `runtime/nuxt/` (it imports `#app`) but deliberately
  **not** in the ported `nuxt/index.ts`, which maps file-for-file to `nextjs/index.ts` — hence
  its own `./app` subpath: neither `./client` (plain Vue) nor `./server` (Nitro) can host it.

##### A-05 — one import path for every type an annotation needs

- **Port** · [`vue/index.ts`](./src/runtime/vue/index.ts)
- **Why** · typing Convex code means reaching into four upstream entry points, because
  `convex/react`'s index carries only some of what you need:

  | From | Types |
  |---|---|
  | `convex/browser` | `ConnectionState`, `OptimisticUpdate`, `QueryJournal` |
  | `convex/server` | `FunctionReference`, `FunctionReference_future`, `FunctionArgs`, `FunctionReturnType`, `OptionalRestArgs`, `ArgsAndOptions` |
  | `convex/values` | `Value` |

  A React user imports each from where it lives, which is unremarkable — they are already
  writing imports. A Nuxt user is not: the module's whole surface is auto-imported, so a type
  that is *not* re-exported here is the one thing in a file that forces a hand-written import.
  All of the above are re-exported so that never happens.

  Three more are re-exported because they exist only in the port and have no upstream
  counterpart to import: `PaginatedWatch` (what `watchPaginatedQuery` returns), `ConvexLogger`
  (the type behind `ConvexVueClientOptions.logger`) and `VueMutationOptions` (N-02).

##### A-06 — `useBetterAuth` service extensions

- **Port** · [`better-auth/vue/use-better-auth.ts`](./src/runtime/better-auth/vue/use-better-auth.ts)
- **Pinned by** · `test/unit/auth/vue/use-better-auth.test.ts`
- **Why** · beyond upstream's `{ isLoading, isAuthenticated, fetchAccessToken }`, the service
  exposes the raw `client`, the `session` ref, a `user` computed and an `authVersion` computed
  (`undefined` until the session settles, so the settling re-registers nothing; `isLoading` flips
  instead if the page's token turns out to be another user's), plus the `BetterAuthUser` / `UseBetterAuthReturn` / `BetterAuthSession` types. Auth *flows* (sign-in/out, OTP,
  passkeys, …) are deliberately **not** wrapped — like upstream, they are called on the app's
  own `authClient` (exposed as `client`), typed by whatever plugins that client installs.

#### Wiring and plumbing

The Nuxt analogs of what a React app assembles by hand, plus the types that assembly needs.

##### A-07 — Nuxt plugins in place of provider components

- **Port** · [`vue/plugin.ts`](./src/runtime/vue/plugin.ts),
  [`better-auth/vue/plugin.client.ts`](./src/runtime/better-auth/vue/plugin.client.ts),
  [`better-auth/vue/plugin.server.ts`](./src/runtime/better-auth/vue/plugin.server.ts)
- **Pinned by** · `test/unit/base-client-plugin.test.ts`, `test/unit/auth/vue/plugin-client.test.ts`, `test/nuxt/auth/vue/plugin-server-cache.test.ts`, `test/unit-server/prerender-auth-prefetch.test.ts`
- **Why** · the file-level counterpart of N-03 / N-04. `vue/plugin.ts` registers only when no
  auth integration owns the client. The client plugin deliberately does **not** tear down on
  `beforeunload` — that event is cancelable and fires before the user answers an
  unsaved-changes dialog, so closing there would drop in-flight mutations; upstream never
  closes on unload either. The server plugin skips the token prefetch under
  `import.meta.prerender`: a prerendered page has no visitor. Next has no analog — its
  `getToken()` reads `next/headers`, which opts the route out of static rendering entirely.

##### A-08 — `createScopedConvexAuthState`

- **Port** · [`vue/auth/index.ts`](./src/runtime/vue/auth/index.ts)
- **Pinned by** · `test/unit/auth/vue/plugin-client.test.ts`
- **Why** · the `EffectScope`-wrapped variant of `createConvexAuthState`, so the Better Auth
  client plugin can dispose the auth watchers. React unmounts a component tree; Vue needs an
  explicit scope when the state is installed at app level.

##### A-09 — module wiring

- **Port** · [`src/module.ts`](./src/module.ts), [`src/registry.ts`](./src/registry.ts),
  [`src/options.ts`](./src/options.ts), [`src/aliases.ts`](./src/aliases.ts),
  [`src/templates.ts`](./src/templates.ts), [`src/codegen-watch.ts`](./src/codegen-watch.ts),
  [`src/functions-dir.ts`](./src/functions-dir.ts), [`src/dev-script.ts`](./src/dev-script.ts),
  [`nuxt/config.ts`](./src/runtime/nuxt/config.ts)
- **Pinned by** · `test/module/registration.test.ts` (everything the module registers, on a real Nuxt instance), `test/unit/module-options.test.ts`, `test/unit/aliases.test.ts`, `test/unit/functions-dir.test.ts`, `test/unit/diagnostics.test.ts`, `test/unit/convex-type-fallback.test.ts`, `test/unit/codegen-watch.test.ts`, `test/unit/dev-script.test.ts`
- **Why** · options, auto-imports, integration auto-detection, the `#convex/*` aliases and the
  generated-types fallback. Next apps wire Convex by hand. An integration auto-enables when its
  package is both declared in the app's own `package.json` and resolvable — resolution alone
  walks every ancestor `node_modules`, so a sibling app's package would switch it on in a
  monorepo; an explicit `true` needs only resolution.
- **Also** · the module resolves the deployment URL itself (`resolveDeploymentUrls`):
  `convex.url`, then `NUXT_PUBLIC_CONVEX_URL`, then the unprefixed `CONVEX_URL`. Upstream has
  no such step — a Next app reads `process.env.NEXT_PUBLIC_CONVEX_URL` at the call site, and the
  Convex CLI writes that name because its framework detection has a Next case. It has no Nuxt
  case, so for Nuxt the CLI writes `CONVEX_URL`; reading both is what lets a Convex user reach a
  working app without a `convex.url` line. The same gap is why `src/dev-script.ts` exists: the
  first `nuxt dev` / `nuxt prepare` rewrites a plain `nuxt dev` script to
  `convex dev --start "nuxt dev"`, so the CLI starts Nuxt itself — Convex's own demos ship that
  script; a Nuxt app has no template to get it from (`convex.devScript: false` opts out). And in
  development the module reads `.env.local` beneath the environment (`deploymentEnv`): Vite and
  Next load that file themselves, Nuxt does not, and on the first `--start` run the CLI has
  written it but has not loaded it into the environment it hands Nuxt.
- **Opt-out** · `convex.exclude` leaves out every registration whose name, as the app would see it,
  a string or pattern names: app and Nitro auto-imports, components, the `convex-auth` middleware
  (`registeredAs`, `isExcluded` in `src/registry.ts`). A module building on this one registers its
  own names for the same things; without it, it had to filter this module's entries out of Nuxt's
  hooks after the fact. Pinned by `test/module/registration.test.ts` — "with exclude"

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
- **Pinned by** · `test/unit/csp.test.ts`, `test/unit/security-plugin.test.ts`, `test/module/registration.test.ts`, `test/e2e/security-off.test.ts`
- **Why** · Convex needs its deployment origin in `connect-src` and its storage origin in the
  resource directives, or a default `nuxt-security` CSP silently breaks the app. `csp.ts` holds
  import-free pure helpers; `security.ts` is the Nitro plugin merging them into `nuxt-security`'s
  route rules. Registered only when the app has `nuxt-security` installed. `module.ts` also gives
  `nuxt-security` defaults for `nuxt dev`, which keep a local server working.

##### A-12 — `convex-auth` route middleware and its redirect guard

- **Port** · [`better-auth/nuxt/middleware.ts`](./src/runtime/better-auth/nuxt/middleware.ts)
  (the `convex-auth` route middleware),
  [`better-auth/nuxt/server-guard.ts`](./src/runtime/better-auth/nuxt/server-guard.ts)
  (`serverGuard`, its own file so the middleware's lazy client chunk doesn't carry the server
  session check), [`better-auth/vue/redirect.ts`](./src/runtime/better-auth/vue/redirect.ts)
  (`resolveAuthRedirect`)
- **Pinned by** · `test/unit/auth-redirect.test.ts`, `test/unit/auth/nuxt/middleware.test.ts`
- **On sync** · keep both, and keep the docs pointing login pages at `resolveAuthRedirect`
  rather than `route.query.redirect`
- **Why** · upstream ships no route middleware, so the convention is the port's — and so is the
  open-redirect surface its `?redirect=` query creates. `resolveAuthRedirect` closes it:
  same-origin paths pass; absolute, scheme-relative (`//host`), backslash (`/\host`),
  non-HTTP-scheme and repeated-parameter values fall back to the default. `serverGuard` fails
  closed: with no request event it redirects rather than rendering the page.

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
- **Pinned by** · `test/e2e/better-auth-proxy.test.ts`, `test/unit/auth/nuxt/proxy.test.ts`
- **On sync** · `xssValidator: false` is **load-bearing** — do not "tidy" it away
- **Why** · the proxy delegates to `convexAuth(event).handler()`, which strips hop-by-hop
  headers and rewrites forwarded-host headers exactly as `convexBetterAuthNextJs` does; only
  the Nitro route registration is port-only. The route rules are what need justifying:
  `xssValidator: false` is a **correctness** fix, not hardening — `nuxt-security`'s validator
  HTML-escapes the JSON body and 400s when that changes anything, so a password containing `<`
  or `>` would never reach Better Auth. `allowedMethodsRestricter` pins the route to
  GET/HEAD/POST/OPTIONS, and the handler asserts the same list itself, so the route stays
  closed without nuxt-security. Both rules apply regardless of `convex.security`, since they
  concern the module's own route rather than the app's CSP. The handler resolves the site URL
  through `convexAuth` (private runtime key, then public, then env) rather than reading one
  key — a build without the URL, configured at start-up through
  `NUXT_PUBLIC_CONVEX_SITE_URL`, reaches only the public key. It also refuses a request whose
  URL-normalised path differs from the routed one: Nitro routes the raw path, so
  `/api/auth/../../x` matches the route and would be forwarded as `/x` — any HTTP action on the
  site origin, through the app's origin. Next normalises before routing; upstream's handler never
  sees such a path. The site URL must parse as `http:`/`https:`
  before any request is made, because it is the only thing pinning the proxy's destination host.

#### Tooling

##### A-15 — Nuxt DevTools panel

- **Port** · `src/runtime/devtools/**`, `src/devtools/**`, `devtools-client-app/`
- **Pinned by** · `test/unit/devtools-bridge.test.ts`, `test/unit/devtools-dock-client.test.ts`, `test/unit/devtools-setup.test.ts`, `test/unit/devtools-function-source.test.ts`
- **On sync** · the bridge reads client internals — see [§4](#4-keeping-parity)
- **Why** · dev-only query/mutation inspection. `runtime/devtools/bridge.ts` deliberately observes
  `ConvexVueClient` from the *outside* so `vue/client.ts` stays byte-diffable.

##### A-16 — `useAsyncPaginatedQuery`

- **Port** · [`nuxt/composables/use-async-paginated-query.ts`](./src/runtime/nuxt/composables/use-async-paginated-query.ts)
  — `useAsyncPaginatedQuery` / `useConvexAsyncPaginatedQuery`, returning `usePaginatedQuery`'s
  `{ results, status, isLoading, loadMore }` plus `{ error, refresh }`; exported from `nuxt/app.ts`
- **Pinned by** · `test/nuxt/use-async-paginated-query.test.ts`, `test/nuxt/public-surface.test.ts`
- **Why** · A-04 for lists: the first page is fetched with `fetchQuery` during SSR
  (`paginationOpts: { numItems, cursor: null }`) and hydrated from the payload; on the client
  `usePaginatedQuery` takes over and its first page replaces the server one. Client-side
  navigation fetches nothing over HTTP — a one-shot page could not be deduplicated against the
  subscription, whose args carry the pagination id. The query error lands in `error` rather than
  being thrown, as in A-04.

##### A-17 — `<ConvexImage>`

- **Port** · [`vue/components/convex-image.ts`](./src/runtime/vue/components/convex-image.ts)
  — `ConvexImage`, auto-registered; props `getUrl`, `storageId`; slots default (loading) and
  `missing` (the file is gone)
- **Pinned by** · `test/nuxt/convex-image.test.ts`
- **Why** · the one thing every app does with A-02's `useStorageUrl` — `<img v-if="url" :src="url">`
  with a placeholder while the URL resolves and another when the query returns `null`. Attributes
  fall through to the `<img>`; `getUrl` is read once, like `useStorageUrl`'s argument.

##### A-18 — `nuxt-convex-module/testing`

- **Port** · [`nuxt/testing.ts`](./src/runtime/nuxt/testing.ts) — `resetBetterAuthState`, defined in
  [`better-auth/vue/use-better-auth.ts`](./src/runtime/better-auth/vue/use-better-auth.ts) beside the
  state it resets
- **Pinned by** · `test/unit/auth/vue/use-better-auth.test.ts` — "forgets the cached token and the
  session subscription on resetBetterAuthState", "keeps the old reset name, which test helpers reach
  by path, as the same function"; `test/nuxt/public-surface.test.ts`
- **Why** · the browser's token cache and its session subscription live at module scope for the
  app's lifetime (D-13), where upstream keeps them in a provider a test unmounts. An app's tests
  need to forget them between cases, and used to reach `use-better-auth.js` by path for the
  `@internal` `__resetUseBetterAuthForTests`. That name stays, deprecated, as the same function,
  so a helper written against the path keeps working.

### 3.4 Upstream fixes the translation already rules out

Landed in mapped files, needed no code change, and are pinned by a test so a refactor cannot
reintroduce the bug. **Do not re-litigate.**

| Upstream | Commit | Why no port | Pinned by |
|---|---|---|---|
| `convex` 1.43.0 — `PaginatedQueryClient.splitPaginatedQueryPage` restarted the first half of a split page from `cursor: null`, duplicating items when a non-first page split | `7ceee3e` | The port's `splitQuery` inherits the split page's own cursor (D-07) | `test/nuxt/use-paginated-query.test.ts` — "splits a non-first page from that page's own cursor, not the start of the list" |
| `convex` 1.44.0 — `ConvexProviderWithAuth`'s context value wrapped in `useMemo` | `b96ea1b` | The port builds the state object once per `createConvexAuthState` call and carries reactivity in `ComputedRef`s, so its identity is already stable; the named locals mirror upstream's memo inputs for diffability | `test/unit/vue/convex-auth-state.test.ts` — "keeps the state object and its computed refs referentially stable across auth transitions" |
| `convex` 1.42.2 — `ConvexProviderWithClerk` ignored org-change deps `[orgId, orgRole, sessionId]` | — | The port's `authVersion` key (N-13) already keyed on those three values | `test/nuxt/auth/vue/clerk.test.ts` |

### 3.5 Upstream bugs fixed in the port (`F-*`)

Upstream's code is wrong here, so the port does the correct thing instead of copying the bug.
These are fixes, not differences in behaviour. Each entry says what the bug is, how the port
fixes it, and where it was reported. When upstream ships its fix, sync it and delete the entry
and its marker.

#### F-01 — the JWT cache retries on auth errors; upstream retries on non-auth errors

- **Kind** · inverted condition
- **Upstream** · `@convex-dev/better-auth@0.13.0` `nextjs/index.ts` — `callWithToken`
- **Port** · [`better-auth/nuxt/server.ts`](./src/runtime/better-auth/nuxt/server.ts)
- **Pinned by** · `test/unit/auth/nuxt/server.test.ts` — "refreshes the token once when jwt cache
  marks the first error as auth-related", "rethrows non-auth errors without refreshing even
  when the jwt cache is enabled"
- **Reported** · [convex/better-auth#440](https://github.com/convex/better-auth/pull/440)
- **On sync** · do **not** sync the condition back
- **Why** · with `jwtCache` enabled, a call uses the JWT cached in a cookie. When Convex rejects
  that token with an auth error, the call should refresh the token once and retry. Upstream's
  condition is inverted: it rethrows the auth error, and it refreshes and re-runs the call on
  every other error, where a new token cannot help. The port retries exactly when
  `jwtCache.isAuthError(error)` is true.

#### F-02 — `window.open` gains `noopener`

- **Kind** · security gap
- **Upstream** · `@convex-dev/polar@0.9.2` `react/index.tsx` — `window.open(url, '_blank')`
- **Port** · [`polar/vue/components.ts`](./src/runtime/polar/vue/components.ts) — `CheckoutLink`
- **Pinned by** · `test/nuxt/billing-components.test.ts`
- **Reported** · [convex/polar#93](https://github.com/convex/polar/pull/93)
- **On sync** · keep the third argument
- **Why** · unlike `<a target="_blank">`, `window.open` keeps `window.opener` live, so the
  checkout tab could navigate the app's tab. The forced `null` return is unused, so the fix
  costs nothing. Not an open redirect: `url` is the app's own Convex action response.

#### F-03 — `usePaginatedQuery` throws the missing-client error

- **Kind** · missing guard
- **Upstream** · `convex@1.49.0` `react/use_paginated_query.ts` — `useConvex().logger`
- **Port** · [`vue/composables/use-paginated-query.ts`](./src/runtime/vue/composables/use-paginated-query.ts) — `useConvexOrThrow('usePaginatedQuery')`
- **Pinned by** · `test/nuxt/composables.test.ts` — "usePaginatedQuery"
- **Reported** · [convex/convex-js#214](https://github.com/convex/convex-js/pull/214)
- **On sync** · keep
- **Why** · without a provider, upstream reads `.logger` from `undefined`, so the user gets
  `TypeError: Cannot read properties of undefined (reading 'logger')`. Every other hook throws
  `Could not find Convex client!` with its own name; this one did not.

#### F-04 — `usePreloadedAuthQuery` declares the `undefined` it returns

- **Kind** · wrong return type
- **Upstream** · `@convex-dev/better-auth@0.13.0` `nextjs/client.tsx` — declares `| null`
- **Port** · [`better-auth/vue/hydration.ts`](./src/runtime/better-auth/vue/hydration.ts)
- **Pinned by** · `test/nuxt/preload-hydration.test.ts` — "keeps auth-preloaded data while auth
  loads, then clears for unauthenticated users"
- **Reported** · [convex/better-auth#441](https://github.com/convex/better-auth/pull/441)
- **On sync** · keep `| null | undefined` until upstream declares `| undefined`, then take
  upstream's type
- **Why** · for a visitor who is not signed in, the query is skipped and the hook returns
  `undefined`, never `null`. A `result === null` check never matches, and TypeScript does not
  warn. Declaring both keeps code written against upstream compiling and matches what arrives.

#### F-05 — a failed token refresh keeps the token it would have replaced

- **Kind** · a transient failure read as a signed-out session
- **Upstream** · `@convex-dev/better-auth@0.13.0` `react/index.tsx` — `fetchAccessToken`
- **Port** · [`better-auth/vue/use-better-auth.ts`](./src/runtime/better-auth/vue/use-better-auth.ts)
- **Pinned by** · `test/unit/auth/vue/use-better-auth.test.ts` — "keeps the token when a refresh fails
  with the session still standing", "drops the token when the server says the session is gone",
  "never answers a failed refresh with another session's token", "never answers a failed refresh
  with a page token that belongs to another user"
- **Reported** · not yet
- **On sync** · keep; if upstream handles failed fetches, compare before dropping the entry
- **Why** · upstream turns every failed fetch into `null`, and on `null` the sync client signs a live
  connection out and never retries, so one failed request leaves the page without Convex auth until a
  reload. Only a 401 says the session is gone. Any other failure returns the current session's token:
  the client sees no new token and keeps running, and a fresh one is fetched when the server rejects
  it at expiry.

---

## 4. Keeping parity

The procedure — locating the upstream repository, diffing the mapped paths between two tags,
classifying each hunk, applying [§2.2](#22-translation-rules) — is the
[`upstream-parity` skill](./website/skills/upstream-parity/SKILL.md). It covers three jobs:
syncing a release, adding a ported symbol or a Vue-only extension, and recording a divergence.
What follows is the part that has to be *right* rather than merely followed.

### What an upstream release means here

Upstream's version numbers are not this module's ([STABILITY.md](./STABILITY.md) states the
promise; this is the mapping):

| Upstream ships | This module ships |
| --- | --- |
| a patch or minor with no public-API change | a patch or minor, with the baseline bumped below |
| a public addition | a minor |
| a breaking change — even inside an upstream minor, as the upstream `@convex-dev/*` components, still 0.x, and the `_experimental` shapes allow | a **major** |
| a new major that raises a peer floor | a **major** |

One such change is already known: upstream `convex/nextjs` warns today that passing
`url: undefined` to the server helpers "will throw an error in the future". When upstream makes
it throw, this module ships that in a major.

### On every baseline bump

**Move the version everywhere it is stated**, or the docs ship a confidently wrong number.
`test/unit/upstream-baselines.test.ts` fails if any of the three drift apart; it parses this
file's table by row prefix, so keep [§1](#1-what-is-ported)'s row shape verbatim.

| # | Where | Form |
|---|---|---|
| 1 | [§1](#1-what-is-ported), first table | `**1.49.0**` in a table cell |
| 2 | [`website/app/utils/upstream-baselines.ts`](./website/app/utils/upstream-baselines.ts) | the site's machine-readable copy (hero chip, introduction, component pages) |
| 3 | [`website/content/3.components/1.index.md`](./website/content/3.components/1.index.md) | last cell of each component row |

**Diff beyond the file map.** Code the port *re-implements* rather than mirrors has no mapped
counterpart, yet a fix there can still imply a fix here. For `convex` that is
`src/browser/sync` — home of `PaginatedQueryClient` (X-05). Diffing only the mapped paths would
have missed 1.43.0's `7ceee3e` ([§3.4](#34-upstream-fixes-the-translation-already-rules-out)).

**Re-check the internals the port reaches.** Each is declared as a local interface extension
rather than a cast at the use site, so a rename surfaces as a type error — but only if the
upstream change is noticed:

- `setAdminAuth` / `localQueryLogs` on `BaseConvexClient` (`vue/client.ts`); `setFetchOptions`
  / `setAdminAuth` on `ConvexHttpClient` (`nuxt/index.ts`); `paginationOptions`, which the
  published `RequestForQueries` strips and the module-local `RequestForQueriesCompat` declares,
  as upstream's own does (`vue/queries-observer.ts`, `composables/use-queries.ts`).
- The DevTools bridge (A-15) reads the TS-private `listeners` map and `cachedSync`,
  instance-patches `transition` / `close`, and reaches `localQueryResultByToken` and
  `optimisticQueryResults.queryLogs` on `BaseConvexClient`. Re-check against
  `browser/sync/client.ts`. The canary in `test/unit/devtools-bridge.test.ts` fails loudly on a
  rename; the worst case is a broken dev panel, never a broken app — every access is
  optional-chained.
- Types derived locally because upstream imports them from a non-exported path
  (`PaginatedQueryResult`, `SubscribeToPaginatedQueryOptions`, `EmptyObject`,
  `LoadMoreOfPaginatedQuery`, `validateDeploymentUrl`). If upstream ever exports them properly,
  switch to the import (N-13).

**Move a peer range everywhere it is stated.** A range lives in `package.json`'s
`peerDependencies`, the [`STABILITY.md`](./STABILITY.md) table and the installation page's
range table; `test/docs/docs-contract.test.ts` holds the last two to the first. A `convex` floor
also moves in `website/package.json`, `templates/starter` and `examples/playground`. A range
held by an add-on's own peer has a Dependabot ignore too: `@convex-dev/better-auth@0.13.0` peers
`better-auth >=1.7.16 <1.8.0`, and `.github/dependabot.yml` holds Dependabot below 1.8. Both
move only when the add-on's own peer range does.

### The gate

A sync runs the full gate in [`AGENTS.md`](./AGENTS.md#verification).

### History

| Date | Package | From → To | Commit | What was ported |
|---|---|---|---|---|
| 2026-11-07 | `@convex-dev/better-auth` | 0.12.6 → 0.13.0 | #142 | Better Auth 1.7, and with it both peer floors. Ported: the proxy drops any `x-forwarded-host` / `-proto` the request arrived with (0.12.7's `3e8af5d`); from `5f418ce`, a prefetched token names its session (trusted once that session settles, never for another one), an in-flight refresh answers before the cached token, a finished request leaves a newer one in flight, and a signed-out session's refetch can't bring the prefetched token back (D-03, D-16). `AuthClientWithCrossDomain` is now exported. Upstream's structural `AuthClient` isn't ported: the `#convex/auth-client` alias already types the app's own client. Client plugins are reused as-is, so their changes arrive with the dependency. The Convex-side changes are for the app, through the add-on's upgrade guide |
| 2026-11-03 | `convex` | 1.48.0 → 1.49.0 | #132 | Nothing: no commits in the mapped paths, `src/browser/sync`, `src/browser/http_client.ts` or `src/common` since `npm/1.47.0`, and the published `dist/esm` and `.d.ts` for `browser`, `react`, `nextjs`, `react-clerk` and `react-auth0` are byte-identical; exports and peers unchanged. The release adds `v.function()`, the `convex plugins` CLI command and an `engines.node` floor of 22, below this module's own |
| 2026-10-29 | `@convex-dev/better-auth` | 0.12.5 → 0.12.6 | #117 | Security release (`37ed22f`, GHSA-pgx2-m66h-x29f). Ported: the proxy no longer stamps `x-forwarded-host` / `x-forwarded-proto`, only the `x-better-auth-forwarded-*` pair, which the Convex side now restores only for hosts listed exactly in `trustedOrigins`. The release's other fix, one-time tokens only for trusted-origin redirects (GHSA-j8qq-g9pm-v3c2), is server-side; the client plugins are unchanged |
| 2026-10-23 | `convex` | 1.47.0 → 1.48.0 | #95 | Nothing: the mapped paths, `src/browser/sync`, `src/browser/http_client.ts` and `src/common` are unchanged, as are the package exports; the release touches the CLI and the server `ctx` APIs. Diffed from the npm tarballs' `src/`, as upstream had not pushed tag `npm/1.48.0` |
| 2026-10-19 | `convex` | 1.46.0 → 1.47.0 | #87 | Nothing: no commits in the mapped paths, `src/browser/sync`, `src/browser/http_client.ts` or `src/common`; the published client `dist` is byte-identical |
| 2026-10-01 | `convex` | 1.45.0 → 1.46.0 | #61 | `99b33c1`, types only: every hook, client method and Nitro helper also accepts a `FunctionReference_future`, re-exported (A-05), and `useAsyncQuery` widens with `useQuery`. The `convex` peer floor moves to `^1.46.0`, the first version that ships the type |
| 2026-09-01 | `convex` | 1.42.3 → 1.45.0 | `9b3d58d` | Nothing — both upstream fixes ruled out ([§3.4](#34-upstream-fixes-the-translation-already-rules-out)). Two pinning tests added; `better-auth` peer range mirrored |
| 2026-07-28 | `convex` | → 1.42.3 | `b5891af` | Clerk adapter change (org-change deps → `authVersion`) |
| 2026-07-28 | `@convex-dev/better-auth` | → 0.12.5 | `b5891af` | Initial pin |
| 2026-07-28 | `@convex-dev/polar` | → 0.9.2 | `b5891af` | Initial pin |
