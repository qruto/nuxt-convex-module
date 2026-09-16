# Stability

`nuxt-convex-module` follows [semantic versioning](https://semver.org). This is what a version number promises.

## What is covered

Everything a consumer can write against, whether or not it appears in `package.json`:

- **Module options** — every key of `ModuleOptions` and `BetterAuthModuleOptions`, and its default.
- **Runtime config** — the five `runtimeConfig` keys the module writes and their Nitro override
  names (`NUXT_PUBLIC_CONVEX_URL`, `NUXT_PUBLIC_CONVEX_SITE_URL`,
  `NUXT_PUBLIC_CONVEX_CROSS_DOMAIN_CALLBACK_ROUTE`, `NUXT_PUBLIC_CONVEX_LOGIN_PATH`,
  `NUXT_CONVEX_SITE_URL`), plus the unprefixed `CONVEX_URL` / `CONVEX_SITE_URL` read at build time.
- **Import aliases** — the `#convex/*` names and their resolution order, and `#convex/auth-client`.
- **Auto-imports and components** — every name on the
  [app](https://nuxt-convex-module.dev/api-reference/auto-imports) and
  [server](https://nuxt-convex-module.dev/api-reference/server-imports) auto-import pages, and every
  auto-registered component. This registry lives in no manifest; it is the most-used surface.
- **Subpath exports** — every key of `exports` in `package.json`, and every value and type
  reachable from it. `test/nuxt/public-surface.test.ts` records the full list.
- **Wiring** — the `convex-auth` middleware name, the `authRoute` proxy route and its method list, the
  `?redirect=` query the middleware attaches.
- **Peer floors** — the `peerDependencies` ranges, `compatibility.nuxt`, and `engines.node`.

Removing or renaming any of these, changing a default, tightening a peer range or raising a floor
is a **major** release.

## Tiers

Everything covered above is **stable** unless listed here.

**Experimental** — may change in a minor release, always with a changelog entry; carries an
`@experimental` tag in source and a callout in the docs:

- `useQuery_experimental` and `UseQueryResult`
- `usePaginatedQuery_experimental`, `UsePaginatedQueryOptions`, `UsePaginatedQueryObjectReturnType`
- `<AuthBoundary>`
- `useConvexConnectionState`, the `ConnectionState` shape, `ConvexVueClient.connectionState()` and
  `ConvexVueClient.subscribeToConnectionState()`
- `resetPaginationId`

The rule behind the list: a symbol upstream marks experimental or unstable is experimental here.
The port cannot promise more than the code it mirrors.

**Internal** — no promise at all: anything tagged `@internal` (stripped from the published
types, present at runtime for parity), the DevTools panel and its RPC, `__resetUseBetterAuthForTests`,
and how `#convex/auth-client` is resolved.

## Upstream versions and this module's

This module is a port of `convex/react`, `convex/nextjs`, `@convex-dev/better-auth` and
`@convex-dev/polar`. Upstream's version numbers are not this module's: how an upstream release
maps to a release here is in [PARITY.md §4](./PARITY.md#4-keeping-parity), next to the pinned
baselines.

## Supported versions

Nuxt `>=4.1.0` and Node `>=24.11.0`, plus these `peerDependencies` ranges — every one but `vue`
and `convex` is optional, needed only by the integration it powers:

| Package | Range |
|---|---|
| `vue` | `^3.5.0` |
| `convex` | `^1.40.0` |
| `@convex-dev/better-auth` | `>=0.12.0 <0.13.0` |
| `better-auth` | `~1.6.11` |
| `@convex-dev/polar` | `>=0.9.0 <0.10.0` |
| `@polar-sh/checkout` | `>=0.4.0` |
| `@clerk/vue` | `>=2.0.0` |
| `@auth0/auth0-vue` | `>=2.0.0` |
| `nuxt-security` | `>=2.6.0` |

A range is what you may install. The baseline [PARITY.md](./PARITY.md) pins per upstream package
is narrower: the exact release the ported files were diffed against, and the one the test suite
runs on.

## Deprecation

A stable symbol that is going away is marked `@deprecated` with its replacement, logs a runtime
warning where types cannot catch the use, stays for at least one minor, and is removed in the next
major. The changelog names every deprecation.

## Not covered

- The wording of the module's own warnings and errors — documented on
  [Troubleshooting](https://nuxt-convex-module.dev/getting-started/troubleshooting) — may be
  reworded in a minor. Text ported from upstream changes only with a baseline bump.
- The DevTools panel's UI.
- The docs site and the generated reference's formatting.
- Generated template filenames and Nuxt payload keys.
