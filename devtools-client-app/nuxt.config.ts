import { fileURLToPath } from 'node:url'

// The DevTools panel app. Served inside the Nuxt DevTools iframe at
// /__nuxt-convex-module — by a dev-server handler from dist/devtools-client in the published
// package, or via the Vite dev proxy (port 3630, `pnpm dev:devtools-client`)
// while developing this module.
export default defineNuxtConfig({
  modules: ['@nuxt/devtools-ui-kit'],
  ssr: false,
  // One page with tabs, so no vue-router in the bundle.
  pages: false,
  devtools: { enabled: false },
  app: {
    baseURL: '/__nuxt-convex-module',
  },
  // The panel ships inside the package; there is no deployment to check for
  // new builds of.
  experimental: { appManifest: false },
  compatibilityDate: 'latest',
  nitro: {
    output: {
      publicDir: fileURLToPath(new URL('../dist/devtools-client', import.meta.url)),
    },
    // Static-host SPA fallbacks; the module's handler serves index.html itself.
    prerender: { ignore: ['/200.html', '/404.html'] },
  },
  vite: {
    server: {
      hmr: {
        // The panel is served through the module's Vite proxy, which can't carry
        // the HMR websocket — point the client straight at this app's own port
        // instead. Same fix as nuxt/starter#module-devtools.
        clientPort: Number(process.env.PORT || 3630),
      },
    },
  },
})
