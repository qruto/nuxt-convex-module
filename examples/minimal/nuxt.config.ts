// The whole configuration. The module reads the deployment URL from
// `NUXT_PUBLIC_CONVEX_URL`, or from the `CONVEX_URL` that `npx convex dev`
// writes to `.env.local` — Nuxt does not load that file on its own, which is
// why the `dev` script passes `--dotenv .env.local`.
export default defineNuxtConfig({
  modules: ['nuxt-convex-module'],
  compatibilityDate: 'latest',
})
