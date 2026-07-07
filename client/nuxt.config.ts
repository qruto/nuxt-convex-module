import { fileURLToPath } from 'node:url'

// The DevTools panel app. Served inside the Nuxt DevTools iframe at
// /__nuxt-convex — via sirv from dist/client in the published package, or via
// the Vite dev proxy (port 3630) while developing this module.
export default defineNuxtConfig({
  modules: ['@nuxt/devtools-ui-kit'],
  ssr: false,
  devtools: { enabled: false },
  app: {
    baseURL: '/__nuxt-convex',
  },
  compatibilityDate: 'latest',
  nitro: {
    output: {
      publicDir: fileURLToPath(new URL('../dist/client', import.meta.url)),
    },
  },
})
