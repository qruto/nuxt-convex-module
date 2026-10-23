// Every integration at once, for CI's consumer smoke test (the `pack` job): it
// installs the packed module into a copy of this app without a lockfile, builds
// it on the newest Nuxt and serves `/`. Each integration switches on because
// package.json declares its package, at the module's peer range.
export default defineNuxtConfig({
  modules: ['nuxt-security', 'nuxt-convex-module'],
  compatibilityDate: '2025-07-15',
  convex: {
    // Placeholders: nothing has to answer, the page renders without a backend.
    url: 'https://example.convex.cloud',
    siteUrl: 'https://example.convex.site',
  },
})
