<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets/hero-dark.svg">
  <img src="https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets/hero-light.svg" alt="Nuxt × Convex" width="560">
</picture>

<a href="https://www.npmjs.com/package/nuxt-convex-module"><img src="https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets/npm.svg" alt="npm" height="20" align="middle"></a> &nbsp;<a href="https://www.npmjs.com/package/nuxt-convex-module"><sub><b>View on npm</b></sub></a> &nbsp;&nbsp;&nbsp; <a href="https://github.com/qruto/nuxt-convex-module"><img src="https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets/github.svg" alt="GitHub" height="20" align="middle"></a> &nbsp;<a href="https://github.com/qruto/nuxt-convex-module"><sub><b>Source on GitHub</b></sub></a>

# nuxt-convex-module

Connects a [Nuxt](https://nuxt.com) app to a [Convex](https://convex.dev) backend: live queries, mutations, actions, pagination,
file storage and SSR, auto-imported and typed against your deployment.

<sub>The same [Vue](https://vuejs.org) client runs without Nuxt; Better Auth, Clerk, Auth0 and Polar are opt-in.</sub>

[![Nuxt][nuxt-src]][nuxt-href]
[![Convex][convex-src]][convex-href]
<img src="https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets/separator.svg" alt="" height="20">
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
<img src="https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets/separator.svg" alt="" height="20">
[![Tests][tests-src]][tests-href]
[![Coverage][coverage-src]][coverage-href]
<img src="https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets/separator.svg" alt="" height="20">
[![License][license-src]][license-href]

```bash
npx nuxi@latest module add nuxt-convex-module
```

[Documentation](https://nuxt-convex-module.dev) · [Installation](https://nuxt-convex-module.dev/getting-started/installation) · [Components](https://nuxt-convex-module.dev/components) · [Upstream parity](./PARITY.md) · [Stability](./STABILITY.md) · [Security](#security)

</div>

## What you get

- ⚡ **Live data** — [`useQuery`, `useQueries`](https://nuxt-convex-module.dev/guide/queries), [`useMutation`, `useAction`](https://nuxt-convex-module.dev/guide/mutations-and-actions) and cursor [`usePaginatedQuery`](https://nuxt-convex-module.dev/guide/pagination), over one `ConvexVueClient`.
- 🖥️ **SSR and preloading** — [`useAsyncQuery`, `useAsyncPaginatedQuery`, `fetchQuery`, `preloadQuery`](https://nuxt-convex-module.dev/guide/server-and-ssr) for hydration-safe server rendering; `fetchMutation` / `fetchAction` on the Nitro side.
- 📁 **File storage** — [`useUpload`, `useUploadQueue`, `useStorageUrl`](https://nuxt-convex-module.dev/guide/file-storage) and `<ConvexImage>`.
- 🔐 **Auth state** — provider-agnostic [`useConvexAuth` / `provideConvexAuth`](https://nuxt-convex-module.dev/guide/auth-state) and the `<Authenticated>` / `<Unauthenticated>` / `<AuthLoading>` / `<AuthRefreshing>` components.
- 🧩 **Opt-in integrations** — install [Better Auth, Clerk, Auth0 or Polar](https://nuxt-convex-module.dev/components) and they wire themselves up.
- 🛡️ **Security** — install [`nuxt-security`](https://nuxt-convex-module.dev/getting-started/security) and the CSP learns your deployment's origins.
- 🧰 **DevTools** — a Convex tab in [Nuxt DevTools](https://nuxt-convex-module.dev/guide/devtools): connection, live subscriptions, server logs, auth state.

All of it is auto-imported — composables and components in the app, `fetch*` helpers in Nitro — and also reachable through [subpath exports](https://nuxt-convex-module.dev/api-reference#subpath-exports). The same Vue client runs in a [plain Vue app](https://nuxt-convex-module.dev/guide/plain-vue) with no Nuxt involved.

**Packages covered:** `convex` (its `/react`, `/nextjs`, `/react-clerk` and `/react-auth0` entry points), `@convex-dev/better-auth` and `@convex-dev/polar` — each with its pinned upstream version under [Components](https://nuxt-convex-module.dev/components).

## How it's built

A Nuxt/Vue **port of Convex's own React/Next client**, hook for composable, not a reimagining: the public API keeps the names, arguments and return shapes Convex documents, so its docs and examples translate line for line. The port is kept diffable against upstream so new Convex releases can be tracked file-for-file — see [Relationship to upstream](#relationship-to-upstream) and [`PARITY.md`](./PARITY.md).

Composables follow [VueUse](https://vueuse.org) conventions (`MaybeRefOrGetter` inputs, `ComputedRef`/`ShallowRef` returns). Authentication is **provider-agnostic**: the core ships the generic `provideConvexAuth` plumbing plus Vue adapters for [Clerk](https://clerk.com) and [Auth0](https://auth0.com), while [Better Auth](https://www.better-auth.com) and [Polar](https://polar.sh) are **opt-in** sub-modules — mirroring how `@convex-dev/better-auth` and `@convex-dev/polar` are separate packages upstream.

## Documentation

**[nuxt-convex-module.dev](https://nuxt-convex-module.dev) is the single source of truth** — installation, configuration, every guide, each supported package and the complete API reference live there and nowhere else, so this README does not repeat them. Its source is [`website/`](./website).

- [Installation](https://nuxt-convex-module.dev/getting-started/installation) · [Configuration](https://nuxt-convex-module.dev/getting-started/configuration) · [Security](https://nuxt-convex-module.dev/getting-started/security) · [Troubleshooting](https://nuxt-convex-module.dev/getting-started/troubleshooting)
- [Guide](https://nuxt-convex-module.dev/guide) — queries, mutations and actions, pagination, file storage, server and SSR, auth state, connection state, DevTools, plain Vue
- [Components](https://nuxt-convex-module.dev/components) — Better Auth, Clerk, Auth0, Polar
- [API reference](https://nuxt-convex-module.dev/api-reference) and [Recipes](https://nuxt-convex-module.dev/recipes)

## A taste

```vue
<script setup lang="ts">
import { api } from '#convex/api'

// SSR-rendered AND live-updating — Nuxt's { data, status, error } shape:
const { data: messages } = useAsyncQuery(api.messages.list, {})
const send = useMutation(api.messages.send)
</script>

<template>
  <ul><li v-for="m in messages" :key="m._id">{{ m.body }}</li></ul>
  <button @click="send({ body: 'hi' })">Send</button>
</template>
```

To start a new app, create it from [`templates/starter`](templates/starter), an unbranded Nuxt app with the module installed and one live Convex table:

```bash
pnpm create nuxt@latest my-app -t gh:qruto/nuxt-convex-module/templates/starter
# or, with npm (keep the `--`)
npm create nuxt@latest my-app -- -t gh:qruto/nuxt-convex-module/templates/starter
```

For something you can click around in, [`examples/playground`](examples/playground) runs every core feature from one page: live queries, mutations with optimistic updates, cursor pagination, file storage, actions, and server rendering with `fetchQuery`, one click each. Create it the same way with `examples/playground` in place of `templates/starter`. It's also what the **Open in StackBlitz** link on every pull request opens, with that commit's build already wired in, so a change can be tried in a real Nuxt app without setting one up. Both run against a Convex deployment of your own: `dev` starts Convex, which logs you in and pushes the app's functions.

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

[`PARITY.md`](./PARITY.md) is the authoritative ledger: pinned upstream baselines, the file-by-file map, a compatibility matrix per upstream entry point, and every deliberate divergence with its reason and the test that pins it. It also carries the migration contract and the React→Vue translation rules the port is held to. The sync procedure itself is packaged as the [`upstream-parity` skill](./website/skills/upstream-parity/SKILL.md).

[`STABILITY.md`](./STABILITY.md) is the other contract: what a version number promises from 1.0.0 on — the covered surface, the experimental tier, and how an upstream release maps to a release here (an upstream breaking change is a major here, whatever upstream called it).

## Contributing

Setup, project structure, the verification gate and the release flow are in [CONTRIBUTING.md](./CONTRIBUTING.md) and [RELEASE.md](./RELEASE.md); how the port tracks upstream is in [PARITY.md](./PARITY.md). Commits follow conventional commits.

## Security

The [security guide](https://nuxt-convex-module.dev/getting-started/security) documents every security aspect in one place: the Convex-aware CSP, the hardened Better Auth proxy, auth tokens in SSR payloads, safe post-sign-in redirects, cross-domain one-time tokens, file-storage caveats, and a production checklist.

Found a vulnerability? Report it privately via [GitHub Security Advisories](https://github.com/qruto/nuxt-convex-module/security/advisories/new) — not in a public issue. See [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-convex-module/latest.svg?style=plastic&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-convex-module

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-convex-module.svg?style=plastic&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-convex-module

[license-src]: https://img.shields.io/npm/l/nuxt-convex-module.svg?style=plastic&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-convex-module

[tests-src]: https://img.shields.io/github/actions/workflow/status/qruto/nuxt-convex-module/ci.yml?branch=main&style=plastic&colorA=020420&label=tests
[tests-href]: https://github.com/qruto/nuxt-convex-module/actions/workflows/ci.yml

[coverage-src]: https://img.shields.io/codecov/c/github/qruto/nuxt-convex-module?style=plastic&colorA=020420&label=coverage
[coverage-href]: https://codecov.io/gh/qruto/nuxt-convex-module

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt&style=plastic
[nuxt-href]: https://nuxt.com
[convex-src]: https://img.shields.io/badge/Convex-020420?logo=convex&style=plastic
[convex-href]: https://convex.dev
