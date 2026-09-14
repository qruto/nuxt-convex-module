# Stability

What a version number of `nuxt-convex-module` promises, from 1.0.0 on.

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
- **Wiring** — the `auth` middleware name, the `authRoute` proxy route and its method list, the
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
`@convex-dev/polar` ([PARITY.md](./PARITY.md) pins the exact releases). Upstream's version
numbers are not this module's:

| Upstream ships | This module ships |
| --- | --- |
| a patch or minor with no public-API change | a patch or minor, with the baseline bumped in PARITY.md |
| a public addition | a minor |
| a breaking change — even inside an upstream minor, as the 0.x components and the `_experimental` shapes allow | a **major** |
| a new major that raises a peer floor | a **major** |

One such change is already known: upstream `convex/nextjs` warns today that passing `url: undefined`
to the server helpers "will throw an error in the future". When upstream makes it throw, this
module ships that in a major.

## Deprecation

A stable symbol that is going away is marked `@deprecated` with its replacement, logs a runtime
warning where types cannot catch the use, stays for at least one minor, and is removed in the next
major. The changelog names every deprecation.

## Not covered

- The wording of the module's own warnings and errors — documented on
  [Troubleshooting](https://nuxt-convex-module.dev/getting-started/troubleshooting), may be
  reworded in a minor. Text ported from upstream changes only with a baseline bump.
- The DevTools panel's UI.
- The docs site and the generated reference's formatting.
- Generated template filenames and Nuxt payload keys.
