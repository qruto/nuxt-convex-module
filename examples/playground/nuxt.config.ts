import { createRequire } from 'node:module'

// The dependency range for the module, read straight off this app's
// package.json. On a preview build pkg.pr.new rewrites it to
// `https://pkg.pr.new/qruto/nuxt-convex-module@<sha>` before publishing the
// StackBlitz template, so the running app can tell you which commit it is
// exercising — see `components/BuildBadge.vue`.
const { dependencies } = createRequire(import.meta.url)('./package.json') as {
  dependencies: Record<string, string>
}

export default defineNuxtConfig({
  modules: ['nuxt-convex-module'],

  compatibilityDate: 'latest',

  convex: {
    // Bring your own deployment: drop NUXT_PUBLIC_CONVEX_URL into `.env.local`
    // and that is the whole configuration. The `dev` script passes
    // `--dotenv .env.local`, which both loads that file and watches it, so the
    // dev server restarts on save and this app flips from its setup panel to
    // the live demo — nothing to restart by hand.
    //
    // CONVEX_URL is the second choice because that is the *unprefixed* name the
    // Convex CLI writes into the same file, for anyone running `convex dev`
    // against this app locally.
    url: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL,
  },

  runtimeConfig: {
    public: {
      moduleSpec: dependencies['nuxt-convex-module'],
    },
  },
})
