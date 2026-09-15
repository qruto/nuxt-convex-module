import { fileURLToPath } from 'node:url'
import { signalDark, signalLight } from './shiki-themes'

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
  // nuxt-security's default limiter (150 requests per 5 minutes per IP) is
  // sized for a built site. Vite serves a page as hundreds of module
  // requests, so in dev one reload plus a couple of screenshots trips it
  // and every page turns into a 429 for the next five minutes.
  $development: {
    security: { rateLimiter: false },
  },
  devtools: { enabled: true },
  app: {
    head: {
      meta: [
        { name: 'color-scheme', content: 'light dark' },
        // Ground tones — Nuxt UI neutral-900 dark, and the lightened
        // titanium canvas (oklch 93.8%) light. Both are set in the
        // ground ladder at the top of app/css/depth.css; keep in sync.
        { name: 'theme-color', content: '#171717', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#eaeaea', media: '(prefers-color-scheme: light)' },
        { name: 'apple-mobile-web-app-title', content: 'Nuxt Convex' },
      ],
      // Favicon set generated from the Nuxt × Convex mark (`public/logo.svg`)
      // by RealFaviconGenerator's own core library — see the note in
      // `public/logo.svg` and the memory entry for how to regenerate it.
      // This is RFG's full default set: a 96px PNG for browsers that ignore
      // SVG icons, the vector itself, the ICO for legacy consumers, the iOS
      // touch icon, and the manifest.
      //
      // `tagPriority` is load-bearing. Docus's own `app/app.vue` hardcodes a
      // keyless `useHead({ link: [{ rel: 'icon', href: '/favicon.ico' }] })`,
      // which nothing can dedupe away — and because a component's useHead is
      // merged after `app.head`, it would otherwise render *after* these and
      // win, since browsers take the last `rel="icon"` candidate. Pushing
      // these past unhead's default priority (100) puts the vector last.
      // Verify with a real request, not the config: the SVG link must be the
      // final `rel="icon"` in the served HTML.
      //
      // Fonts have no <link>s: @nuxt/fonts (auto-registered by Nuxt UI)
      // self-hosts every family named in app.css's `@theme` --font-* vars.
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96', tagPriority: 120 },
        { rel: 'shortcut icon', href: '/favicon.ico', tagPriority: 120 },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png', tagPriority: 120 },
        { rel: 'manifest', href: '/site.webmanifest', tagPriority: 120 },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg', tagPriority: 121 },
      ],
    },
  },
  site: {
    name: 'Nuxt Convex',
    url: 'https://nuxt-convex-module.dev',
  },
  // The scheme is the operating system's: no toggle on the page (the
  // app/components/app overrides) and no `d` shortcut (app.config
  // `docus.shortcuts`). A key of this site's own, so a light/dark
  // preference a visitor stored while a toggle existed under
  // @nuxtjs/color-mode's default key is never read again.
  colorMode: { storageKey: 'nuxt-convex-module-color-mode' },
  // Use Node's built-in `node:sqlite` for Nuxt Content's local DB instead of the
  // `better-sqlite3` native addon. Requires Node >= 22.5 at build & runtime.
  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        // The generated reference documents members at h4; the default
        // depth (2) keeps them out of "On this page".
        toc: { depth: 3 },
        highlight: {
          // Docus's list plus `dotenv`, for the `.env` samples.
          langs: ['bash', 'diff', 'json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml', 'dotenv'],
          // The site's own palette (see shiki-themes.ts). Nuxt Content hands
          // theme OBJECTS straight to shiki, keyed by these map keys — the
          // `--shiki-default` / `--shiki-light` / `--shiki-dark` CSS variables
          // the rendered spans carry come from the keys, not the theme names.
          //
          // `light` must be spelled out even though it repeats `default`:
          // Nuxt UI seeds this map with all THREE keys (material-theme /
          // -lighter / -palenight) and the merge is per-key, so overriding
          // only default+dark leaves material-theme-lighter sitting on
          // `light` — and light mode reads --shiki-light, so every code block
          // rendered in someone else's blues and purples.
          theme: {
            default: signalLight,
            light: signalLight,
            dark: signalDark,
          },
        },
      },
    },
  },
  routeRules: {
    // The stability page was folded into the introduction (versioning +
    // experimental) and the installation page (requirements).
    '/getting-started/stability': { redirect: { to: '/getting-started/introduction#versioning', statusCode: 301 } },
  },
  // Every page change is a view transition: Nuxt snapshots the page,
  // swaps the route, and the browser animates between the two —
  // drawn in app/css/chrome.css (THE PAGE TURN), given its direction
  // by app/plugins/page-turn.client.ts. `true`, not 'always': under
  // prefers-reduced-motion Nuxt skips it and the page just changes.
  experimental: { viewTransition: true },
  compatibilityDate: 'latest',
  typescript: {
    // `@nuxt/content` is docus's dependency, not this app's, so under pnpm's
    // isolated layout nothing beneath website/node_modules resolves it. Nuxt
    // Content's generated `.nuxt/content/types.d.ts` imports `@nuxt/content`
    // to augment `Collections` with the site's collections — and with
    // `skipLibCheck` an unresolved import in a .d.ts fails silently, so the
    // augmentation attached to nothing and every docus component reading
    // `Collections['docs']` / `DocsCollectionItem` failed to type-check.
    // Hoisting writes a `paths` alias resolved through the layer's own
    // node_modules, the same copy docus's sources import.
    hoist: ['@nuxt/content'],
  },
  hooks: {
    // Client HMR needs NO override: Nuxt CLI pins the HMR WebSocket to the
    // main dev server (verified: no standalone HMR port is ever bound), so
    // the browser's derived default — wss://<page-host>/_nuxt/ — goes through
    // the portless https proxy to the main server, which upgrades it. Any
    // `server.hmr = { port }` override only re-points the CLIENT at a port
    // nothing listens on, killing HMR and Nuxt DevTools (its RPC rides the
    // same hot channel → "Disconnected from Server").
    'vite:extendConfig'(config, { isClient }) {
      if (!config.server) return
      if (!isClient) {
        // The SSR vite-node server has HMR disabled but still opens a WebSocket
        // on the default 24678 unless `ws` is turned off explicitly — turn it
        // off so parallel Nuxt dev servers don't fight over that port.
        config.server.ws = false
        return
      }
      // Let Vite's watcher see `content/`. @nuxt/content appends `content/**`
      // to `nuxt.options.ignore`, which Nuxt hands straight to Vite as
      // `server.watch.ignored` — so Vite never reports a markdown edit, and
      // @tailwindcss/vite (which rescans its `@source` globs from its own
      // `hotUpdate` hook) never rebuilds. A utility class written for the first
      // time in markdown — `[Nuxt]{.text-green-500}`, a `class:` prop — then
      // renders with no rule behind it and silently does nothing, while classes
      // already present at dev-server start work fine. Content's ignore is there
      // to stop NUXT restarting on every save; that lives on
      // `nuxt.options.ignore` and stays untouched — only Vite's copy opens up,
      // so markdown edits reach Tailwind's scanner (at the cost of the
      // full-reload it fires on a source change).
      const contentDir = fileURLToPath(new URL('content', import.meta.url))
      const ignored = config.server.watch?.ignored
      if (ignored) {
        config.server.watch!.ignored = (Array.isArray(ignored) ? ignored : [ignored])
          .map(rule => typeof rule !== 'function'
            ? rule
            : (path: string) => !path.startsWith(contentDir) && rule(path))
      }
    },
  },
  // The playground pages run against the local anonymous Convex deployment.
  // Better Auth stays off (the docs deployment has no auth server); Polar's
  // components are enabled — the playground demos them against demo actions.
  convex: {
    url: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL,
    siteUrl: process.env.NUXT_PUBLIC_CONVEX_SITE_URL || process.env.CONVEX_SITE_URL,
    // The repository's root `pnpm dev` already wraps this app in
    // `convex dev --start`; the module must not rewrite this package's script.
    devScript: false,
  },
  // Publish the repository's own agent skill at /.well-known/skills/ (Docus
  // scans each subfolder for a SKILL.md; .agents/skills/upstream-parity links here).
  docus: { skills: { dir: 'skills' } },
  // Providers are pinned rather than discovered. @nuxt/fonts walks its
  // provider list per family, and Technor exists on Fontshare only — naming
  // the source keeps a cold cache from resolving it somewhere else (or not
  // at all). Weights are the ones the site actually sets: 400 body, 500/600
  // UI, 700 headings and code emphasis. Technor is display-only — 600 on the
  // small plate/footer titles, 700 on the hero and section headings.
  // Families themselves are declared in app/css/theme.css as --font-*
  // tokens, which is what this scans.
  fonts: {
    // No `<link rel="preload" as="font">`. nuxt-security computes its SRI
    // hashes in `nitro:build:before`, but @nuxt/fonts only writes the real
    // font bytes into its public-asset dir in nitro's later `rollup:before`
    // hook — until then every `_fonts/*.woff2` is an empty placeholder. So a
    // preloaded font ships with `integrity="sha384-<hash of "">"`, the
    // browser rejects the preloaded response, the matching `@font-face`
    // request fails with it, and the face silently falls back (Technor 600
    // rendered as Bai Jamjuree on production, 2026-09-15). `@font-face`
    // URLs carry no integrity, so without the preload the fonts load again.
    defaults: { preload: false },
    families: [
      { name: 'Technor', provider: 'fontshare', weights: [600, 700] },
      { name: 'Bai Jamjuree', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Kode Mono', provider: 'google', weights: [400, 600, 700] },
    ],
  },
  // A two-icon house collection (`i-nc-*`) for the CTA arrows. Lucide — the
  // set the rest of the site draws from — locks its stroke at 2/24, which at
  // the hero button's 24px reads as a chunky signpost next to the display
  // type. These are the same geometry drawn at 1.5/24 with a longer shaft and
  // a narrower (≈37°) head: at the 18px the CTAs set them, the stroke lands on
  // 1.1px, so the arrow sits in the type's own weight class rather than
  // shouting over it.
  icon: {
    customCollections: [
      { prefix: 'nc', dir: fileURLToPath(new URL('app/assets/icons', import.meta.url)) },
    ],
  },
  // `llms.txt` — the section map an agent reads first. Docus fills title
  // and description from package.json; the generated TypeDoc pages are
  // left out, the hand-written pages are what an agent should read.
  llms: {
    sections: [
      { title: 'Getting Started', contentCollection: 'docs', contentFilters: [{ field: 'path', operator: 'LIKE', value: '/getting-started/%' }] },
      { title: 'Guide', contentCollection: 'docs', contentFilters: [{ field: 'path', operator: 'LIKE', value: '/guide/%' }] },
      { title: 'Components', contentCollection: 'docs', contentFilters: [{ field: 'path', operator: 'LIKE', value: '/components/%' }] },
      { title: 'Recipes', contentCollection: 'docs', contentFilters: [{ field: 'path', operator: 'LIKE', value: '/recipes/%' }] },
      { title: 'API Reference', contentCollection: 'docs', contentFilters: [{ field: 'path', operator: 'LIKE', value: '/api-reference/%' }, { field: 'path', operator: 'NOT LIKE', value: '/api-reference/reference/%' }] },
    ],
  },
  // Docus / Nuxt Content compile a SQLite WASM module in the browser (search +
  // client-side content queries). The nuxt-security CSP (the module registers
  // nuxt-security, declared in this app's package.json, when it detects it) must allow
  // WebAssembly compilation — extend `script-src` with `'wasm-unsafe-eval'`.
  security: {
    headers: {
      contentSecurityPolicy: {
        // The introduction shows the README's lockup straight from the
        // repository; nuxt-security's default is `'self' data:`.
        'img-src': ['\'self\'', 'data:', 'https://raw.githubusercontent.com'],
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
