// The dependency range for the module, read straight off this app's
// package.json. On a preview build pkg.pr.new rewrites it to
// `https://pkg.pr.new/qruto/nuxt-convex-module@<sha>` before publishing the
// StackBlitz template, so the running app can tell you which commit it is
// exercising — see `app/components/BuildBadge.vue`.
import { dependencies } from './package.json'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-convex-module'],

  // No `convex` block on purpose: the module reads `NUXT_PUBLIC_CONVEX_URL` and
  // the `CONVEX_URL` that `npx convex dev` writes, so pointing this app at a
  // deployment is one line in `.env.local` and nothing else. The `dev` script
  // passes `--dotenv .env.local`, which both loads that file and watches it, so
  // the app flips from its setup panel to the live demo on save. It is not the
  // `convex dev --start 'nuxt dev'` the module writes into a fresh app, because
  // the sandbox does not run Convex; the `convex` script, which runs
  // `convex dev`, is what tells the module to leave `dev` alone. Integrations
  // switch on only for packages this package.json declares — none — so a clone
  // of the module repository, where Better Auth and friends resolve from the
  // root, behaves the same as the StackBlitz sandbox.

  runtimeConfig: {
    public: {
      moduleSpec: dependencies['nuxt-convex-module'],
    },
  },
})
