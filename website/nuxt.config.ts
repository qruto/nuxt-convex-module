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
        // Ground tones — Nuxt UI neutral-900 / neutral-200 (see app.css).
        { name: 'theme-color', content: '#171717', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#e5e5e5', media: '(prefers-color-scheme: light)' },
        { name: 'apple-mobile-web-app-title', content: 'Nuxt Convex' },
      ],
      // Favicon set rasterised from the Nuxt × Convex mark (`public/logo.svg`).
      // Tab icons are pre-rendered PNG/ICO on a transparent background — no SVG
      // favicon: browsers rasterise the mark's gradients/filters poorly at 16px.
      // Fonts have no <link>s: @nuxt/fonts (auto-registered by Nuxt UI)
      // self-hosts every family named in app.css's `@theme` --font-* vars.
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
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
    // Client HMR needs NO override: Nuxt CLI pins the HMR WebSocket to the
    // main dev server (verified: no standalone HMR port is ever bound), so
    // the browser's derived default — wss://<page-host>/_nuxt/ — goes through
    // the portless https proxy to the main server, which upgrades it. Any
    // `server.hmr = { port }` override only re-points the CLIENT at a port
    // nothing listens on, killing HMR and Nuxt DevTools (its RPC rides the
    // same hot channel → "Disconnected from Server").
    'vite:extendConfig'(config, { isClient }) {
      if (!config.server || isClient) return
      // The SSR vite-node server has HMR disabled but still opens a WebSocket
      // on the default 24678 unless `ws` is turned off explicitly — turn it
      // off so parallel Nuxt dev servers don't fight over that port.
      config.server.ws = false
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
