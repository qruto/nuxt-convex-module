import { getRandomPort } from 'get-port-please'

// The playground runs against a local anonymous Convex deployment
// (`npx convex dev` in this directory). The Convex CLI stores its URLs in
// `.env.local`, which Nuxt doesn't load on its own — surface them here.
try {
  process.loadEnvFile(new URL('.env.local', import.meta.url).pathname)
}
catch {
  // No local deployment configured yet — the site still builds; the
  // playground pages show their "offline" state.
}

// The documentation site for `nuxt-convex-module` — one Nuxt app combining the
// product homepage and the docs. Docus (extended as a layer) provides the docs
// theme, Nuxt Content, search, and SEO; `nuxt-convex-module` is installed so the
// composables/components are available to live examples.

// Nuxt CLI normally pins Vite's HMR WebSocket to the main dev server so no
// separate port is used. Under `portless` (our dev script) that pin doesn't
// hold, so Vite falls back to a standalone HMR socket on its fixed default port
// 24678 — and every Nuxt dev server then fights over it ("Port 24678 is already
// in use"). Hand the client HMR socket its own free port instead so parallel
// dev servers coexist. See the `vite:extendConfig` hook below.
const hmrPort = await getRandomPort()

export default defineNuxtConfig({
  extends: ['docus'],
  modules: [
    'nuxt-convex-module',
  ],
  devtools: { enabled: true },
  app: {
    head: {
      meta: [
        { name: 'color-scheme', content: 'light dark' },
        { name: 'theme-color', content: '#161616', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#e8e8e8', media: '(prefers-color-scheme: light)' },
        { name: 'apple-mobile-web-app-title', content: 'Nuxt Convex' },
      ],
      // Favicon set generated from the Nuxt × Convex mark via RealFaviconGenerator's
      // engine (`@realfavicongenerator/generate-favicon`). Assets live in `public/`.
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
  site: {
    name: 'Nuxt Convex',
  },
  // Use Node's built-in `node:sqlite` for Nuxt Content's local DB instead of the
  // `better-sqlite3` native addon. Requires Node >= 22.5 at build & runtime.
  content: {
    experimental: { sqliteConnector: 'native' },
  },
  compatibilityDate: 'latest',
  hooks: {
    // Runs after Nuxt CLI's `vite:extend` HMR pin, so this wins. A plain port
    // number (unlike a live server object) survives Vite's config resolution,
    // giving the client its own standalone HMR socket on a free port.
    'vite:extendConfig'(config, { isClient }) {
      if (!config.server) return
      if (isClient) {
        // Client HMR: use our own free port instead of the shared default.
        config.server.hmr = { port: hmrPort }
      }
      else {
        // The SSR vite-node server has HMR disabled but still opens a WebSocket
        // on the default 24678 unless `ws` is turned off explicitly — turn it
        // off so it doesn't collide with other Nuxt dev servers.
        config.server.ws = false
      }
    },
  },
  // The playground pages run against the local anonymous Convex deployment.
  // Better Auth stays off (the docs deployment has no auth server); Polar's
  // components are enabled — the playground demos them against demo actions.
  convex: {
    url: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL,
    siteUrl: process.env.NUXT_PUBLIC_CONVEX_SITE_URL || process.env.CONVEX_SITE_URL,
    betterAuth: false,
  },
  // Docus / Nuxt Content compile a SQLite WASM module in the browser (search +
  // client-side content queries). The bundled nuxt-security CSP must allow
  // WebAssembly compilation — extend `script-src` with `'wasm-unsafe-eval'`.
  security: {
    headers: {
      contentSecurityPolicy: {
        'script-src': [
          '\'self\'',
          'https:',
          '\'unsafe-inline\'',
          '\'strict-dynamic\'',
          '\'wasm-unsafe-eval\'',
          '\'nonce-{{nonce}}\'',
        ],
      },
    },
  },
})
