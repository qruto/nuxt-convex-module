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
    // Bring your own deployment, and that is the whole configuration.
    // `.env.local` ships with an empty `CONVEX_URL=` to paste into, and
    // `npm run convex` fills that same line in — one line, whichever way you
    // get there. The `dev` script passes `--dotenv .env.local`, which both
    // loads that file and watches it, so this app flips from its setup panel to
    // the live demo on save, with nothing to restart by hand.
    //
    // The *unprefixed* name is the one that ships, on purpose. `NUXT_PUBLIC_*`
    // is Nuxt's runtime-override channel, and an unfilled `NUXT_PUBLIC_CONVEX_URL=`
    // is still a defined variable: Nitro would apply it at request time and
    // blank this value back out, leaving the page on its setup panel with a
    // perfectly good deployment configured. Set to an actual URL it still wins,
    // which is how you would point a deployed build at a deployment.
    url: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL,

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
