export default defineNuxtConfig({
  modules: ['nuxt-convex-module'],
  convex: {
    // `npx convex dev` writes the *unprefixed* CONVEX_URL to `.env.local`, and
    // Nuxt does not load that file on its own — the `dev` script passes
    // `--dotenv .env.local` so it does. NUXT_PUBLIC_CONVEX_URL still wins when
    // it is set explicitly.
    url: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL,
  },
  compatibilityDate: 'latest',
})
