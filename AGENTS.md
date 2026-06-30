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
| Static hook arguments | `MaybeRefOrGetter` inputs, read via `toValue` |
| Returns a plain value | Returns `ComputedRef` / `ShallowRef` (VueUse convention) |
| JSX helper components (`<Authenticated>`, …) | `defineComponent` render functions in `vue/auth/helpers.ts` |
| Next.js server helpers (`preloadQuery`, `fetchQuery`, …) | Nitro server utils in `nuxt/index.ts` (auto-imported on the server) |

Reuse the existing generic primitives instead of writing new auth cores: the Clerk/Auth0
adapters are thin shims over `provideConvexAuth` / `createConvexAuthState`
(`src/runtime/vue/auth/index.ts`). When an upstream "provider" component takes a `useAuth`
prop, port it as a `useAuthFromX` shim feeding `provideConvexAuth`.

## Known intentional divergences (do not "fix" toward React)

- `watchPaginatedQuery` throws by design — pagination is handled in the `usePaginatedQuery`
  composable (Convex's internal `PaginatedQueryClient` is not a public export).
- File-storage composables (`useUpload`, `useUploadQueue`, `useStorageUrl`) are Vue-only
  extensions.
- Out-of-scope upstream pieces are listed in [PARITY.md](./PARITY.md) (resend = backend-only,
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
