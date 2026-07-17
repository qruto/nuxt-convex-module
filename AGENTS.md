# Agent guide — keeping the port in sync with upstream

This package is a **faithful Vue/Nuxt port** of Convex's React/Next integration
(`convex/react`, `convex/nextjs`, `convex/react-clerk`, `convex/react-auth0`) plus the opt-in
`@convex-dev/better-auth` and `@convex-dev/polar` add-ons. The goal is **file-for-file
diffability**: when upstream releases, the corresponding Vue file should change in the same
shape. [PARITY.md](./PARITY.md) is the authoritative upstream↔ported file map and the pinned
baseline versions; **always start there.**

## Sync workflow (per upstream release)

1. Read [PARITY.md](./PARITY.md) for the current baseline of the upstream package that
   released, and its file mapping.
2. Diff the upstream source paths between the old baseline and the new tag, e.g.:
   ```bash
   git -C <convex-checkout> diff <oldTag> <newTag> -- src/react src/nextjs src/react-clerk src/react-auth0
   ```
3. For each real change (behavior, public API, types — **not** formatting), apply the
   equivalent change to the mapped Vue file using the translation rules below.
4. Update the baseline version in [PARITY.md](./PARITY.md) and the README table.
5. Add/adjust tests mirroring the change; run the verification commands below.
6. Open a PR describing the upstream commit(s) ported and the baseline bump.

## React → Vue translation rules

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

Reuse the existing generic primitives instead of writing new auth cores: the Clerk/Auth0
adapters are thin shims over `provideConvexAuth` / `createConvexAuthState`
(`src/runtime/vue/auth/index.ts`). When an upstream "provider" component takes a `useAuth`
prop, port it as a `useAuthFromX` shim feeding `provideConvexAuth`.

**The migration contract**: public interface names match upstream **verbatim** unless a rule
above sanctions the difference. Vue conveniences must be strictly additive (a required
upstream prop may become optional with an auto-provided default; nothing gets renamed).
User-facing error/warning texts stay verbatim too, modulo the sanctioned name substitutions —
tests and log-matching written against upstream must keep working. The same goes for code
*shape*: keep upstream's destructuring, branch order, and early returns wherever Vue doesn't
force a change, so a side-by-side diff shows only the sanctioned translations, never
stylistic drift. This extends to **internal** symbols: keep upstream's names (even
unexported ones like `splitQuery`, `createInitialState`) and declare them in the same order
as the upstream file; when a rule conflicts with a lint rule, scope the lint rule off for
`src/runtime/**` instead of rewriting the line (see `no-dynamic-delete` in
`eslint.config.js`).

## Known intentional divergences (do not "fix" toward React)

- `watchPaginatedQuery` throws by design — pagination is handled in the `usePaginatedQuery`
  composable (Convex's internal `PaginatedQueryClient` is not a public export).
- The Better Auth runtime imports the app's client via the `#convex/auth-client` alias (resolved
  by `src/module.ts` to the user's `convex.betterAuth.authClient` module or the bundled default).
  This is the Vue/Nuxt analog of `ConvexBetterAuthProvider` taking `authClient` as a prop — do
  **not** "fix" these imports back to a hardcoded `./client`. The `convexClient` /
  `crossDomainClient` client plugins are reused as-is from
  `@convex-dev/better-auth/client/plugins`, never reimplemented.
- File-storage composables (`useUpload`, `useUploadQueue`, `useStorageUrl`) are Vue-only
  extensions.
- `convexAuth`'s JWT-cache retry predicate deliberately inverts upstream v0.12.5's
  `callWithToken`: upstream retries with a force-refreshed token only when
  `jwtCache.isAuthError(error)` is **false** (almost certainly an upstream bug); the port
  retries exactly when the cached JWT is rejected as an auth error. See the comment in
  `src/runtime/better-auth/nuxt/server.ts` and its test — do not sync the condition back.
- `consumeCrossDomainOneTimeToken` accepts a port-only `callbackRoute` option (module option
  `convex.betterAuth.crossDomainCallbackRoute`) restricting `?ott=` consumption to a dedicated
  route — upstream consumes the token on any URL, a login-CSRF surface (see PARITY.md's
  security note). Off by default for parity; keep the guard when syncing.
- Out-of-scope upstream pieces are listed in [PARITY.md](./PARITY.md) (resend = server-only,
  react-start = framework-specific, `convexQueryOptions` = `@internal`).

## Verification

Run the full gate before opening a PR:

```bash
pnpm dev:prepare    # build the module stub + prepare Nuxt
pnpm lint
pnpm test:types     # vue-tsc (lib + website)
pnpm test           # vitest: unit + nuxt projects
pnpm test:quality   # fallow: unused exports, duplication, file-health
```

Tests are the parity safety net: the upstream React suite (last present at tag `npm/1.35.0`,
later removed) was ported to `test/` and extended for Nuxt. Keep them mirroring upstream
scenarios.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`website/convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
