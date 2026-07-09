export default defineNuxtConfig({
  modules: ['nuxt-convex-module'],
  // The Convex deployment URL comes from NUXT_PUBLIC_CONVEX_URL —
  // `npx convex dev` writes it to .env.local; copy it into .env (Nuxt
  // doesn't load .env.local) or export it in your shell.
  compatibilityDate: 'latest',
})
