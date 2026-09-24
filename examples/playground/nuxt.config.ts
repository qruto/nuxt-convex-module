// https://nuxt.com/docs/api/configuration/nuxt-config

// The dependency range for the module, read straight off this app's
// package.json. On a preview build pkg.pr.new rewrites it to
// `https://pkg.pr.new/qruto/nuxt-convex-module@<sha>` before publishing the
// StackBlitz template, so the running app can tell you which commit it is
// exercising — see `app/components/BuildBadge.vue`.
import { dependencies } from './package.json'

export default defineNuxtConfig({
  modules: ['nuxt-convex-module'],
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Nuxt Convex Playground',
      htmlAttrs: { lang: 'en' },
      link: [
        // The website's three typefaces: Technor for titles, Bai Jamjuree for
        // text, Kode Mono for code and numbers.
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600&family=Kode+Mono:wght@400;600&display=swap' },
        { rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=technor@700&display=swap' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  // No `convex` block: `dev` runs `convex dev --start 'nuxt dev'`, and the
  // module reads the deployment URL the Convex CLI writes to `.env.local`.
  // Integrations switch on only for packages this package.json declares — none
  // — so a clone of the module repository, where Better Auth and friends resolve
  // from the root, behaves the same as the StackBlitz sandbox.

  runtimeConfig: {
    public: {
      moduleSpec: dependencies['nuxt-convex-module'],
    },
  },

  compatibilityDate: '2025-07-15',
})
