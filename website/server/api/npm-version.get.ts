// The homepage states the shipped version — so it reads it off the registry
// rather than off a hand-maintained constant that drifts the moment we publish.
// Cached at the edge for an hour: the number changes on release day, not on
// page views, and the registry must never sit on the critical path of a render.
//
// Unpublished / unreachable → `{ version: null }`, and the hero simply drops
// the chip. A stale or invented version number is worse than none.
export default defineCachedEventHandler(
  async () => {
    try {
      const meta = await $fetch<{ version?: string }>(
        'https://registry.npmjs.org/nuxt-convex-module/latest',
        { timeout: 4000, headers: { accept: 'application/json' } },
      )
      return { version: meta?.version ?? null }
    }
    catch {
      return { version: null }
    }
  },
  {
    name: 'npm-version',
    getKey: () => 'nuxt-convex-module',
    maxAge: 60 * 60,
    // Serve the last good answer while a slow registry call refreshes behind it.
    swr: true,
    staleMaxAge: 60 * 60 * 24,
  },
)
