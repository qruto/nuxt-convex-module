# @qruto/nuxt-convex

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Tests][tests-src]][tests-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

[Convex](https://convex.dev) for [Vue](https://vuejs.org) & [Nuxt](https://nuxt.com) — a faithful Vue/Nuxt port of Convex's official React/Next integration.

`@qruto/nuxt-convex` mirrors the upstream `convex/react` + `convex/nextjs` surface composable-for-hook: reactive live queries, mutations, actions, cursor pagination, file storage, connection state, and SSR preloading — adapted to Vue with [VueUse](https://vueuse.org) conventions (`MaybeRefOrGetter` inputs, `ComputedRef`/`ShallowRef` returns). Authentication is **provider-agnostic** like upstream: the core ships the generic `ConvexProviderWithAuth` equivalent (`provideConvexAuth`) plus Vue ports of Convex's [Clerk](https://clerk.com) and [Auth0](https://auth0.com) adapters, while [Better Auth](https://www.better-auth.com) and [Polar](https://polar.sh) are **opt-in** sub-modules — mirroring how `@convex-dev/better-auth` and `@convex-dev/polar` are separate packages upstream.

> 📖 **Full documentation:** the **[docs site](./website)** (homepage · docs · playground, one Nuxt app) covers installation, the integration guide, every composable and server helper, and the complete API reference.

## Supported official packages

Every supported upstream package is ported or wired with the **same public API**, adapted to Vue. Core Convex is always on; the rest light up when their package is installed.

| Official package | What this gives you | Enable | Subpath | Baseline |
|---|---|---|---|---|
| [`convex`](https://npmjs.com/package/convex) — `/react` + `/nextjs` | The whole data layer: composables, `ConvexVueClient`, auth helpers, SSR preload + server (Nitro) utils | **always on** | `…/vue`, `…/server` | `1.42` |
| `convex` — [`/react-clerk`](https://docs.convex.dev/auth/clerk) | [Clerk](https://clerk.com) auth: `provideConvexAuthFromClerk()` · `<ConvexProviderWithClerk>` | `npm i @clerk/vue` | `…/clerk/vue` | `1.42` |
| `convex` — [`/react-auth0`](https://docs.convex.dev/auth/auth0) | [Auth0](https://auth0.com) auth: `provideConvexAuthFromAuth0()` · `<ConvexProviderWithAuth0>` | `npm i @auth0/auth0-vue` | `…/auth0/vue` | `1.42` |
| [`@convex-dev/better-auth`](https://github.com/get-convex/better-auth) | [Better Auth](https://better-auth.com): `useAuth`, `/api/auth/**` proxy, SSR prefetch, `auth` middleware, `<AuthBoundary>`, `backendAuth` | `npm i @convex-dev/better-auth` | `…/better-auth/vue` | `0.12` |
| [`@convex-dev/polar`](https://github.com/get-convex/polar) | [Polar](https://polar.sh) billing: `<CheckoutLink>` · `<CustomerPortalLink>` | `npm i @convex-dev/polar` | `…/polar/vue` | `0.9` |
| [`@convex-dev/resend`](https://github.com/get-convex/resend) | **Backend-only** — no client port needed; call its functions with `useMutation` / `useAction` | (use in your Convex backend) | — | — |

Subpath = `@qruto/nuxt-convex/<subpath>`. Pinned baselines and the file-by-file map: [`PARITY.md`](./PARITY.md).

## How it plugs into Nuxt

Listing `@qruto/nuxt-convex` in your `modules` array wires Convex into every layer of the app — through the same `@nuxt/kit` integration points any module uses. Everything below is registered for you; nothing needs importing or manual wiring.

### Auto-imported composables · `addImports`

**Data**
- `useQuery` / `useConvexQuery` — reactive live query (plus `useQuery_experimental`, the 1.39 result/error split)
- `useQueries` / `useConvexQueries` — several live queries over one subscription
- `useMutation` / `useConvexMutation` — call a Convex mutation
- `useAction` / `useConvexAction` — call a Convex action
- `usePaginatedQuery` — cursor pagination (plus `usePaginatedQuery_experimental`, dual-overload)
- `useConvexConnectionState` — live WebSocket connection status
- `useConvex` — the underlying Convex client

**Files**
- `useUpload` / `useConvexUpload` / `uploadFile` — upload to Convex storage
- `useUploadQueue` / `useConvexUploadQueue` — multi-file upload queue
- `useStorageUrl` / `useConvexStorageUrl` — resolve a stored file's URL

**Auth (provider-agnostic)**
- `useConvexAuth` / `provideConvexAuth` — Convex auth state
- `usePreloadedQuery` — hydrate an SSR-preloaded query on the client

**App API wiring**
- `provideBackendApi` / `useBackendApi` / `useBackendNamespace` — provide and consume the generated `api`

### Auto-imported components · `addComponent`

- `<Authenticated>` / `<Unauthenticated>` / `<AuthLoading>` / `<AuthRefreshing>` — render by auth state

> Integration-specific composables and components auto-import too **when their package is installed** — `useAuth` + `<AuthBoundary>` (Better Auth), `provideConvexAuthFromClerk` + `<ConvexProviderWithClerk>` (Clerk), `provideConvexAuthFromAuth0` + `<ConvexProviderWithAuth0>` (Auth0), `<CheckoutLink>` + `<CustomerPortalLink>` (Polar). See [Supported official packages](#supported-official-packages).

### Server (Nitro) auto-imports · `addServerImports`

- `fetchQuery` / `fetchMutation` / `fetchAction` — one-shot Convex calls
- `preloadQuery` / `preloadedQueryResult` — SSR preload and the client hydration handoff
- `backendAuth` — request-scoped authenticated server client (Better Auth only)

### Plugins, middleware & dev wiring

- **Base client plugin** · `addPlugin` — provides a `ConvexVueClient` (server + client) so the data layer works on its own; Better Auth supplies its own client plugin instead when installed.
- **Provide-api plugin** · `addPluginTemplate` — wires the generated `api` app-wide; fs-guarded to a no-op until `convex dev` has run, and **re-rendered live** the moment codegen appears (`builder:watch`).
- **Server handler + route rule** · `addServerHandler` / `extendRouteRules` — the same-origin `/api/auth/**` proxy, marked uncacheable (Better Auth only).
- **Route middleware** · `addRouteMiddleware` — the opt-in `auth` page guard (Better Auth only).

### Runtime config & import aliases

- **Runtime config** (`backend` key, via `updateRuntimeConfig`): public `backend.url` / `backend.siteUrl`
- **Aliases** (Vite + Nitro): `#backend`, `#backend/api`, `#backend/server`, `#backend/dataModel`, `#backend/_generated`

### Module dependency · `moduleDependencies`

- Installs and configures [`nuxt-security`](https://nuxt-security.vercel.app), applying a Convex-aware CSP in production — `connect-src`, `img-src`, and `media-src` scoped to your deployment.

### Manual imports · subpath exports

Everything above is auto-imported in Nuxt, but each surface is also a real **subpath export** — reach for these for explicit/type-only imports. `/vue`, `/clerk/vue`, `/auth0/vue`, and `/polar/vue` are self-contained, so they also work in a **plain Vue** (non-Nuxt) app; `/better-auth/vue` and `/server` rely on Nuxt-provided aliases/runtime config and need Nuxt:

| Import path | Contents |
|---|---|
| `@qruto/nuxt-convex` | the Nuxt module (for `modules: []`) |
| `@qruto/nuxt-convex/vue` | `ConvexVueClient`, `ConvexClientKey`, every composable (`useQuery`, `useMutation`, `useAction`, pagination, upload, …), auth (`provideConvexAuth`, `useConvexAuth`, `<Authenticated>` …), `usePreloadedQuery`, and all public types |
| `@qruto/nuxt-convex/server` | Nitro/server: `fetchQuery`, `fetchMutation`, `fetchAction`, `preloadQuery`, `preloadedQueryResult` |
| `@qruto/nuxt-convex/clerk/vue` | `provideConvexAuthFromClerk`, `<ConvexProviderWithClerk>` |
| `@qruto/nuxt-convex/auth0/vue` | `provideConvexAuthFromAuth0`, `<ConvexProviderWithAuth0>` |
| `@qruto/nuxt-convex/better-auth/vue` | `useAuth`, `authClient`, `usePreloadedAuthQuery`, `consumeCrossDomainOneTimeToken`, `<AuthBoundary>`, and the `convexClient` / `crossDomainClient` client plugins (re-exported from `@convex-dev/better-auth/client/plugins`) |
| `@qruto/nuxt-convex/better-auth/server` | Nitro/server: `backendAuth(event)` (auto-imported in server code; import explicitly for the `BackendAuthOptions` / `BackendAuthService` types) |
| `@qruto/nuxt-convex/polar/vue` | `<CheckoutLink>`, `<CustomerPortalLink>` |

## Integrations (auto-detected)

You only ever add **one** module. Better Auth and Polar light up automatically when their packages are installed — no extra `modules` entries, no config:

```bash
# add auth → it's wired on next dev
npm i @convex-dev/better-auth better-auth @better-auth/passkey
# add billing components → registered automatically
npm i @convex-dev/polar @polar-sh/checkout
```

```ts
// nuxt.config.ts — still just one module
export default defineNuxtConfig({
  modules: ['@qruto/nuxt-convex'],

  // Everything below is optional. Integrations auto-enable when installed;
  // override only if you want to force one on/off or change the auth route.
  convex: {
    // betterAuth: false,
    // betterAuth: { authClient: './app/convex-auth-client' }, // bring your own client
    // polar: false,
    // authRoute: '/api/auth',
  },
})
```

- **Better Auth** (when `@convex-dev/better-auth` is installed) — a Vue/Nuxt port of its `react` + `nextjs` integration: `useAuth` (session, sign-in/out), the same-origin `/api/auth/**` proxy, SSR token prefetch, the opt-in `auth` route middleware, the `<AuthBoundary>` component, and `backendAuth(event)` for request-scoped server calls. Imported directly via `@qruto/nuxt-convex/better-auth/vue`. Bring your own auth client (to choose plugins — e.g. add `crossDomainClient()` for cross-domain auth) by pointing `convex.betterAuth.authClient` at a module that exports `authClient`; otherwise the bundled default (`convexClient` + `emailOTPClient` + `passkeyClient`) is used.
- **Clerk** (when `@clerk/vue` is installed) — a Vue port of `convex/react-clerk`: `provideConvexAuthFromClerk()` and `<ConvexProviderWithClerk>`. Types via `@qruto/nuxt-convex/clerk/vue`.
- **Auth0** (when `@auth0/auth0-vue` is installed) — a Vue port of `convex/react-auth0`: `provideConvexAuthFromAuth0()` and `<ConvexProviderWithAuth0>`. Types via `@qruto/nuxt-convex/auth0/vue`.
- **Polar** (when `@convex-dev/polar` is installed) — a Vue port of `@convex-dev/polar/react`'s `<CheckoutLink>` and `<CustomerPortalLink>`. Types via `@qruto/nuxt-convex/polar/vue`.

Pure Convex with no auth? Install none of them — you get just the data layer (the module provides a base client on its own), and nothing drags an auth provider or Polar into your bundle.

## Quick start

### 1. Install

```bash
npx nuxi@latest module add @qruto/nuxt-convex
```

> Using **strict** pnpm? Add `public-hoist-pattern[]=@convex-dev/*` to `.npmrc` (or set `node-linker=hoisted`) so Convex can resolve component definitions.

### 2. Add the module

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@qruto/nuxt-convex'],
})
```

### 3. Configure environment

```bash
# .env.local (Nuxt app)
NUXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NUXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

### 4. Start the app, then Convex

```bash
npm run dev
npx convex dev
```

## A taste

```vue
<script setup lang="ts">
import { api } from '#backend/api'

const messages = useQuery(api.messages.list, {})
const send = useMutation(api.messages.send)
</script>

<template>
  <ul><li v-for="m in messages" :key="m._id">{{ m.body }}</li></ul>
  <button @click="send({ body: 'hi' })">Send</button>
</template>
```

## Relationship to upstream

This package is intentionally kept **diffable against the upstream React/Next sources** so it can track new Convex / Better Auth / Polar releases. Each file mirrors its origin:

| This package | Upstream |
|---|---|
| `src/runtime/vue/**` | `convex/src/react/**` |
| `src/runtime/nuxt/**` | `convex/src/nextjs/**` |
| `src/runtime/clerk/**` | `convex/src/react-clerk/**` |
| `src/runtime/auth0/**` | `convex/src/react-auth0/**` |
| `src/runtime/better-auth/**` | `@convex-dev/better-auth/src/{react,nextjs}/**` |
| `src/runtime/polar/**` | `@convex-dev/polar/src/react/**` |

The authoritative file-by-file map, pinned upstream baseline versions, and out-of-scope list live in [`PARITY.md`](./PARITY.md); the React→Vue translation rules an automated sync agent follows are in [`AGENTS.md`](./AGENTS.md).

## Contributing

1. Clone this repository
2. Install dependencies using `pnpm install`
3. Prepare for development using `pnpm dev:prepare`
4. Start the development server (the docs/playground app) using `pnpm dev` — or `pnpm start`

`pnpm dev` runs the playground through [portless](https://portless.sh), so it is served at a stable, named HTTPS URL — **https://nuxt-convex.localhost** — instead of a shifting `localhost:<port>`. portless generates and trusts a local CA on first run (auto-elevating to bind port 443); pass `--no-tls` for plain HTTP, or run `nuxt dev website` directly to bypass portless entirely.

We follow conventional commits. See [CONTRIBUTING.md](./CONTRIBUTING.md) and [RELEASING.md](./RELEASING.md).

## License

[MIT](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@qruto/nuxt-convex/latest.svg?style=plastic&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/@qruto/nuxt-convex

[npm-downloads-src]: https://img.shields.io/npm/dm/@qruto/nuxt-convex.svg?style=plastic&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/@qruto/nuxt-convex

[license-src]: https://img.shields.io/npm/l/@qruto/nuxt-convex.svg?style=plastic&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/@qruto/nuxt-convex

[tests-src]: https://img.shields.io/github/actions/workflow/status/qruto/nuxt-convex/ci.yml?branch=main&style=plastic&colorA=020420&label=tests
[tests-href]: https://github.com/qruto/nuxt-convex/actions/workflows/ci.yml

[coverage-src]: https://img.shields.io/codecov/c/github/qruto/nuxt-convex?style=plastic&colorA=020420&label=coverage
[coverage-href]: https://codecov.io/gh/qruto/nuxt-convex

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt&style=plastic
[nuxt-href]: https://nuxt.com
