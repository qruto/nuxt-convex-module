// The documentation site for `@qruto/nuxt-convex` — one Nuxt app combining the
// product homepage and the docs. Docus (extended as a layer) provides the docs
// theme, Nuxt Content, search, and SEO; `@qruto/nuxt-convex` is installed so the
// composables/components are available to live examples.
export default defineNuxtConfig({
  extends: ['docus'],
  modules: [
    '@qruto/nuxt-convex',
  ],
  devtools: { enabled: true },
  app: {
    head: {
      meta: [
        { name: 'color-scheme', content: 'light dark' },
        { name: 'theme-color', content: '#161616', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#e8e8e8', media: '(prefers-color-scheme: light)' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Gabarito:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
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
  // The docs site is static — it documents the integrations but doesn't run a
  // live Convex backend. Disable the auto-detected Better Auth / Polar runtimes
  // so prerendering stays fast and self-contained (no auth plugins / proxy).
  convex: {
    betterAuth: false,
    polar: false,
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
