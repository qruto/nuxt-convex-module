/**
 * The upstream versions this port is currently verified against.
 *
 * PARITY.md's "Pinned baselines" table is the repository's authority; this file
 * is the site's copy of it, so that every place the site *states* a version —
 * the hero chip, the introduction, each component page — reads one value rather
 * than carrying its own hardcoded number that goes stale on the next sync.
 * `test/unit/upstream-baselines.test.ts` fails if this drifts from PARITY.md,
 * the README table, or the components overview.
 *
 * Bumping a baseline: port the upstream diff, then update PARITY.md and this
 * file (the test names every other spot that has to move with them).
 */
export interface UpstreamBaseline {
  /** The npm package the ported files are diffed against. */
  package: string
  /** The exact upstream version the port currently matches. */
  version: string
  /** The upstream entry points ported from it, as they are named upstream. */
  entries: string
}

export const upstreamBaselines = {
  // Clerk and Auth0 have no package of their own — `convex/react-clerk` and
  // `convex/react-auth0` ship inside `convex`, so their pages point at this
  // same baseline with their own `entry`.
  'convex': {
    package: 'convex',
    version: '1.45.0',
    entries: 'convex/react + convex/nextjs',
  },
  'better-auth': {
    package: '@convex-dev/better-auth',
    version: '0.12.5',
    entries: 'react + nextjs + client plugins',
  },
  'polar': {
    package: '@convex-dev/polar',
    version: '0.9.2',
    entries: 'react components',
  },
} as const satisfies Record<string, UpstreamBaseline>

export type UpstreamSource = keyof typeof upstreamBaselines

/** The parity manifest every baseline plate links out to. */
export const PARITY_MANIFEST_URL
  = 'https://github.com/qruto/nuxt-convex-module/blob/main/PARITY.md'
