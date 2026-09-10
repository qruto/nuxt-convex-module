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

  // No `url` here on purpose: the module reads `NUXT_PUBLIC_CONVEX_URL` and the
  // `CONVEX_URL` that `npx convex dev` writes, so pointing this app at a
  // deployment is one line in `.env.local` and nothing else. The `dev` script
  // passes `--dotenv .env.local`, which both loads that file and watches it, so
  // the app flips from its setup panel to the live demo on save.
  convex: {
    // Data layer only. The module lights up its auth and billing integrations
    // when it finds their packages installed, and Node's lookup walks *up* the
    // directory tree — so run this app from a clone of the module repository
    // and it finds them in the repository root, mounts a Better Auth proxy at
    // /api/auth and 500s on every render. This app has no auth and no billing;
    // saying so keeps it identical in a clone and in the StackBlitz sandbox.
    betterAuth: false,
    clerk: false,
    auth0: false,
    polar: false,
    security: false,
  },

  runtimeConfig: {
    public: {
      moduleSpec: dependencies['nuxt-convex-module'],
    },
  },
})
