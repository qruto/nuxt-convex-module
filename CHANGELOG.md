# Changelog

## v0.12.0

[compare changes](https://github.com/qruto/nuxt-convex-module/compare/v0.11.0...v0.12.0)

### 🚀 Enhancements

- ⚠️  Require Nuxt 4.6 and run the server code on nuxt/server ([#92](https://github.com/qruto/nuxt-convex-module/pull/92))
- ⚠️  Simplify the public surface ([#93](https://github.com/qruto/nuxt-convex-module/pull/93))
- Warn when the app calls another deployment than convex dev ([#100](https://github.com/qruto/nuxt-convex-module/pull/100))
- Run the Convex panel as a Vite DevTools dock on Nuxt DevTools 4 ([#99](https://github.com/qruto/nuxt-convex-module/pull/99))

### 📖 Documentation

- Draw the README's npm and GitHub links as single images ([#101](https://github.com/qruto/nuxt-convex-module/pull/101))
- Store a small file from a mutation ([#102](https://github.com/qruto/nuxt-convex-module/pull/102))

### 🏡 Chore

- Track convex 1.47 and nuxt 4.6, adopt the registry description ([#87](https://github.com/qruto/nuxt-convex-module/pull/87))
- Accept the Nuxt route-rules advisory osv.dev misreads ([#98](https://github.com/qruto/nuxt-convex-module/pull/98))

#### Dependencies

- Patch zod and ip-address, accept zod 3 in the osv scan ([#97](https://github.com/qruto/nuxt-convex-module/pull/97))
- Bump convex from 1.47.0 to 1.48.0 in the upstream group across 1 directory ([#95](https://github.com/qruto/nuxt-convex-module/pull/95))
- Bump markdown-it ([#96](https://github.com/qruto/nuxt-convex-module/pull/96))
- Bump the all-non-major group across 1 directory with 17 updates ([#94](https://github.com/qruto/nuxt-convex-module/pull/94))

#### Dev dependencies

- Bump happy-dom from 20.14.5 to 21.0.4 ([#85](https://github.com/qruto/nuxt-convex-module/pull/85))

### 🤖 CI

- Serve an app with every integration in the consumer smoke test ([#88](https://github.com/qruto/nuxt-convex-module/pull/88))

#### Dependencies

- Bump the actions group across 2 directories with 9 updates ([#89](https://github.com/qruto/nuxt-convex-module/pull/89))

#### ⚠️ Breaking Changes

- ⚠️  Require Nuxt 4.6 and run the server code on nuxt/server ([#92](https://github.com/qruto/nuxt-convex-module/pull/92))
- ⚠️  Simplify the public surface ([#93](https://github.com/qruto/nuxt-convex-module/pull/93))

### ⬆️ Upgrading from 0.11

- **Nuxt 4.6 or newer.** The module's server code now runs on `nuxt/server`, which ships in Nuxt 4.6, and `h3` is no longer a dependency. Moving within Nuxt 4 needs no code changes. Apps that can't move yet stay on 0.11.
- **Polar components take the API as a prop**, as `@convex-dev/polar/react` does: `<CheckoutLink :polar-api="api.billing">` and `<CustomerPortalLink :polar-api="api.billing">`. `provideConvexApi`, `useConvexApi`, `useConvexNamespace`, `ConvexApiKey` and `ConvexApi` are removed, along with the plugin that provided them. Import `api` from `#convex/api` where you need it.
- **`convex.authRoute` is now `convex.betterAuth.authRoute`.** The old key logs an error naming the new one.
- **`NUXT_CONVEX_SITE_URL` is no longer read.** Use `NUXT_PUBLIC_CONVEX_SITE_URL` or `convex.siteUrl`.
- **`convexAuth(event)` takes a `ConvexAuthEvent`**: the `nuxt/server` event, or the h3 event Nuxt 4 routes and `useRequestEvent()` pass. Existing calls keep working; `handler()` needs the `nuxt/server` event.
- **`autoImports: 'prefixed'` now prefixes every name.** Components and types gain `Convex` in front (`<ConvexAuthenticated>`), functions after their first word (`useConvexPreloadedQuery`, `fetchConvexQuery`, `uploadConvexFile`). The default mode is unchanged.
- **Peer ranges are capped:** `@clerk/vue` and `@auth0/auth0-vue` at `^2.0.0`, `nuxt-security` at `^2.6.0`, `@polar-sh/checkout` at `^0.4.0`.

### ❤️ Contributors

- Slava Razum ([@slavarazum](https://github.com/slavarazum))

## v0.11.0

[compare changes](https://github.com/qruto/nuxt-convex-module/compare/v0.10.0...v0.11.0)

### 🚀 Enhancements

- Add an unbranded starter template and find the dev deployment on the first run ([#55](https://github.com/qruto/nuxt-convex-module/pull/55))
- ⚠️  Sync with convex 1.46.0 and shrink what the package ships ([#61](https://github.com/qruto/nuxt-convex-module/pull/61))
- Lead installation with an AI agent and publish an agent skill ([#65](https://github.com/qruto/nuxt-convex-module/pull/65))

#### Website

- Brand social cards for the landing and docs pages ([#51](https://github.com/qruto/nuxt-convex-module/pull/51))
- Protect the live demos from abuse ([#56](https://github.com/qruto/nuxt-convex-module/pull/56))
- Open the install prompt in every agent, and an accessibility and performance pass ([#71](https://github.com/qruto/nuxt-convex-module/pull/71))

### 🩹 Fixes

- Support Nuxt 4.6 production builds and smooth the install flow ([#81](https://github.com/qruto/nuxt-convex-module/pull/81))

#### Dependencies

- Patch transitive security advisories and group Dependabot's CVE fixes ([#76](https://github.com/qruto/nuxt-convex-module/pull/76))

### 📖 Documentation

- Start a new app from an example in one command ([#54](https://github.com/qruto/nuxt-convex-module/pull/54))

### 🏡 Chore

- Track the Claude Code project settings ([#60](https://github.com/qruto/nuxt-convex-module/pull/60))

#### Dependencies

- Patch the open Dependabot advisories ([#66](https://github.com/qruto/nuxt-convex-module/pull/66))
- Bump the all-non-major group with 10 updates ([#69](https://github.com/qruto/nuxt-convex-module/pull/69))
- Bump @clerk/vue, @convex-dev/rate-limiter and docus ([#78](https://github.com/qruto/nuxt-convex-module/pull/78))

#### Dev dependencies

- Bump pkg-pr-new from 0.0.88 to 0.0.90 in the all-non-major group across 1 directory ([#79](https://github.com/qruto/nuxt-convex-module/pull/79))

### 🤖 CI

- Clear the duplication findings failing main and hold nuxt 4.6 too ([#80](https://github.com/qruto/nuxt-convex-module/pull/80))

#### Dependencies

- Bump the actions group across 1 directory with 4 updates ([#52](https://github.com/qruto/nuxt-convex-module/pull/52))
- Bump fallow-rs/fallow ([#68](https://github.com/qruto/nuxt-convex-module/pull/68))
- Bump step-security/harden-runner ([#77](https://github.com/qruto/nuxt-convex-module/pull/77))

#### Website

- Turn off Vercel preview deployments ([#59](https://github.com/qruto/nuxt-convex-module/pull/59))

#### ⚠️ Breaking Changes

- ⚠️  Sync with convex 1.46.0 and shrink what the package ships ([#61](https://github.com/qruto/nuxt-convex-module/pull/61))

### ❤️ Contributors

- Slava Razum ([@slavarazum](https://github.com/slavarazum))

## v0.10.0

[compare changes](https://github.com/qruto/nuxt-convex-module/compare/v0.9.1...v0.10.0)

### 🚀 Enhancements

- ⚠️  Add the autoImports option and rename the auth middleware to convex-auth ([#49](https://github.com/qruto/nuxt-convex-module/pull/49))

#### ⚠️ Breaking Changes

- ⚠️  Add the autoImports option and rename the auth middleware to convex-auth ([#49](https://github.com/qruto/nuxt-convex-module/pull/49))

### ❤️ Contributors

- Slava Razum ([@slavarazum](https://github.com/slavarazum))

## v0.9.1

[compare changes](https://github.com/qruto/nuxt-convex-module/compare/v0.9.0...v0.9.1)

### 🩹 Fixes

#### Website

- Production font and version defects, docs aside widths, hero mark relief ([#47](https://github.com/qruto/nuxt-convex-module/pull/47))

### 🤖 CI

- Resolve the Scorecard action-pinning and weekly link-check findings ([#46](https://github.com/qruto/nuxt-convex-module/pull/46))

#### Release

- Allow the attestation blob host in the publish egress list ([11f2b88](https://github.com/qruto/nuxt-convex-module/commit/11f2b88))

### ❤️ Contributors

- Slava Razum ([@slavarazum](https://github.com/slavarazum))

## v0.9.0

[compare changes](https://github.com/qruto/nuxt-convex-module/compare/v0.0.1...v0.9.0)

### 🚀 Enhancements

- ⚠️  Settle the published surface and fix the runtime ([#31](https://github.com/qruto/nuxt-convex-module/pull/31))
- Add useAsyncPaginatedQuery and <ConvexImage> ([#34](https://github.com/qruto/nuxt-convex-module/pull/34))
- Run Convex beside Nuxt with one dev script ([#35](https://github.com/qruto/nuxt-convex-module/pull/35))

#### Website

- Redesign the landing page and rewrite Getting Started ([#38](https://github.com/qruto/nuxt-convex-module/pull/38))

### 🩹 Fixes

#### Website

- Dedupe the landing's rail lamp cell and band fill ([#43](https://github.com/qruto/nuxt-convex-module/pull/43))

### 📖 Documentation

- Link the npm package under the hero in the README and Introduction ([#41](https://github.com/qruto/nuxt-convex-module/pull/41))
- Make the README point at the docs site as the single source of truth ([#42](https://github.com/qruto/nuxt-convex-module/pull/42))

### 🏡 Chore

#### Dev dependencies

- Bump the all-non-major group across 1 directory with 2 updates ([#39](https://github.com/qruto/nuxt-convex-module/pull/39))

#### Package

- Say what the module does, widen keywords, point at the docs domain ([#29](https://github.com/qruto/nuxt-convex-module/pull/29))

### 🤖 CI

- Move to pnpm 11.26 and group the changelog by scope ([#28](https://github.com/qruto/nuxt-convex-module/pull/28))

#### Dependencies

- Bump fallow-rs/fallow in the actions group across 1 directory ([#36](https://github.com/qruto/nuxt-convex-module/pull/36))

#### ⚠️ Breaking Changes

- ⚠️  Settle the published surface and fix the runtime ([#31](https://github.com/qruto/nuxt-convex-module/pull/31))

### ❤️ Contributors

- Slava Razum ([@slavarazum](https://github.com/slavarazum))

## v0.0.1

[compare changes](https://github.com/qruto/nuxt-convex-module/compare/v0.0.0...v0.0.1)

The first published build, cut to prove the release pipeline end to end; the public surface it
carries is the one v1.0.0 defines.

### 🚀 Enhancements

- **security:** Auto-detect nuxt-security and apply the CSP at runtime ([d08dba2](https://github.com/qruto/nuxt-convex-module/commit/d08dba2))
- **better-auth:** Guard post-sign-in redirects against open redirect ([97dbbab](https://github.com/qruto/nuxt-convex-module/commit/97dbbab))
- **better-auth:** Reject a non-HTTP Convex site URL at startup ([55b0312](https://github.com/qruto/nuxt-convex-module/commit/55b0312))
- **examples:** Give every pull request a runnable playground ([2cfde59](https://github.com/qruto/nuxt-convex-module/commit/2cfde59))

### 🩹 Fixes

- **better-auth:** Stop nuxt-security rejecting valid credentials ([5f69fb5](https://github.com/qruto/nuxt-convex-module/commit/5f69fb5))
- **polar:** Open the checkout tab with noopener ([1999df1](https://github.com/qruto/nuxt-convex-module/commit/1999df1))
- Strip trailing slashes without quadratic backtracking ([ea8be67](https://github.com/qruto/nuxt-convex-module/commit/ea8be67))

### 📖 Documentation

- Rebuild PARITY.md as the port's ledger ([c4238d6](https://github.com/qruto/nuxt-convex-module/commit/c4238d6))
- **security:** Gather every security aspect into one guide ([ee63517](https://github.com/qruto/nuxt-convex-module/commit/ee63517))
- **website:** Restructure the docs into four sections in one sidebar tree ([5e7ecff](https://github.com/qruto/nuxt-convex-module/commit/5e7ecff))

### ❤️ Contributors

- Slava Razum ([@slavarazum](https://github.com/slavarazum))
