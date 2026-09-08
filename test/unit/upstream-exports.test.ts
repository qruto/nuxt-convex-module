import { describe, expect, it } from 'vitest'

// The failure this closes: upstream adds or renames a public export, and the
// port silently falls behind. PARITY.md's file map (parity-manifest.test.ts)
// pins which FILES exist; the baselines (upstream-baselines.test.ts) pin which
// VERSION each was ported from. Neither notices a new `useFoo` appearing in
// `convex/react` — nothing does, until someone reads the upstream changelog.
//
// So the upstream surface is recorded here and compared on every run. A
// failure is not a bug report: it is upstream having moved, and the fix is
// always one of three deliberate acts — port the export, record it as
// deliberately skipped in PARITY.md, or note the rename. Then update this list
// in the same commit.
//
// Accepted limit: names, not signatures. A changed argument type passes here
// and is caught by the type tests and the baseline bump instead. Runtime
// exports only, so a type-only addition also passes — the alternative is
// parsing `.d.ts`, which breaks on every upstream formatting change.

const UPSTREAM_SURFACE: Record<string, string[]> = {
  'convex/react': [
    'AuthLoading', 'AuthRefreshing', 'Authenticated', 'ConvexProvider',
    'ConvexProviderWithAuth', 'ConvexReactClient', 'Unauthenticated',
    'convexQueryOptions', 'includePage', 'insertAtBottomIfLoaded',
    'insertAtPosition', 'insertAtTop', 'optimisticallyUpdateValueInPaginatedQuery',
    'page', 'resetPaginationId', 'useAction', 'useConvex', 'useConvexAuth',
    'useConvexConnectionState', 'useMutation', 'usePaginatedQuery',
    'usePaginatedQueryInternal', 'usePaginatedQuery_experimental',
    'usePreloadedQuery', 'useQueries', 'useQuery', 'useQuery_experimental',
    'useSubscription',
  ],
  'convex/nextjs': [
    'fetchAction', 'fetchMutation', 'fetchQuery', 'preloadQuery',
    'preloadedQueryResult',
  ],
  'convex/react-clerk': ['ConvexProviderWithClerk'],
  '@convex-dev/better-auth/react': ['AuthBoundary', 'ConvexBetterAuthProvider'],
  '@convex-dev/polar/react': ['CheckoutLink', 'CustomerPortalLink'],
}

// `convex/react-auth0` is deliberately absent: importing it needs
// `@auth0/auth0-react`, a React peer this repository has no reason to install
// (the port depends on `@auth0/auth0-vue`). Its surface is a single provider
// component, pinned by `src/runtime/auth0/vue/index.ts` and its own tests.

describe('upstream export surface', () => {
  it.each(Object.entries(UPSTREAM_SURFACE))('%s exports exactly what the port was written against', async (specifier, expected) => {
    const upstream = await import(specifier) as Record<string, unknown>
    const actual = Object.keys(upstream).sort()

    const added = actual.filter(name => !expected.includes(name))
    const removed = expected.filter(name => !actual.includes(name))

    expect(
      { added, removed },
      `${specifier} no longer matches the recorded surface.\n`
      + (added.length > 0 ? `  upstream ADDED: ${added.join(', ')}\n` : '')
      + (removed.length > 0 ? `  upstream REMOVED: ${removed.join(', ')}\n` : '')
      + '  Port it, record it as a deliberate skip in PARITY.md, or note the rename — '
      + 'then update UPSTREAM_SURFACE in the same commit.',
    ).toEqual({ added: [], removed: [] })
  })
})
