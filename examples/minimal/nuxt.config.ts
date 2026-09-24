// The whole configuration. `pnpm dev` runs `convex dev --start 'nuxt dev'`:
// the Convex CLI loads the deployment URL from `.env.local`, Nuxt inherits it
// as `CONVEX_URL`, and the module reads it from there — no `convex` block.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-convex-module'],
})
