import { defineNuxtModule, addPlugin, addPluginTemplate, addImports, addServerHandler, addServerImports, addRouteMiddleware, addComponent, createResolver, type Resolver } from '@nuxt/kit'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Nuxt } from '@nuxt/schema'
import { resolveFunctionsDir } from './functions-dir'

export interface ModuleOptions {
  /** Convex deployment URL (defaults to `NUXT_PUBLIC_CONVEX_URL`). */
  url?: string
  /** Convex `.site` URL (defaults to `NUXT_PUBLIC_CONVEX_SITE_URL`). */
  siteUrl?: string
  /**
   * Better Auth integration. Auto-enabled when `@convex-dev/better-auth` is
   * installed; set `false` to force it off (or `true` to require it).
   */
  betterAuth?: boolean
  /**
   * Polar billing components. Auto-enabled when `@convex-dev/polar` is
   * installed; set `false` to force it off (or `true` to require it).
   */
  polar?: boolean
  /**
   * Clerk auth adapter (`provideConvexAuthFromClerk` / `<ConvexProviderWithClerk>`).
   * Auto-enabled when `@clerk/vue` is installed; set `false` to force it off.
   */
  clerk?: boolean
  /**
   * Auth0 auth adapter (`provideConvexAuthFromAuth0` / `<ConvexProviderWithAuth0>`).
   * Auto-enabled when `@auth0/auth0-vue` is installed; set `false` to force it off.
   */
  auth0?: boolean
  /** Route the Better Auth same-origin proxy is mounted at. Defaults to `/api/auth`. */
  authRoute?: string
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    backend: {
      siteUrl: string
    }
  }
  interface PublicRuntimeConfig {
    backend: {
      url: string
      siteUrl: string
    }
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-convex',
    configKey: 'convex',
  },
  defaults: {
    authRoute: '/api/auth',
  },
  // nuxt-security is an integral part of the integration: declaring it as a
  // module dependency makes Nuxt's core loader install it (hoisting its types
  // and deduping if you also register it yourself), and guarantees our setup
  // runs *before* it — so the Convex-aware CSP defaults below land before
  // nuxt-security reads its config. Configure it via the `security` key.
  moduleDependencies: {
    'nuxt-security': {},
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const { url, siteUrl } = applyRuntimeConfig(nuxt, options)
    registerBackendAliases(nuxt)

    registerBackendApiPlugin(resolver, nuxt)
    registerVueComposables(resolver)
    registerAuthComponents(resolver)
    registerServerImports(resolver)
    registerIntegrations(resolver, nuxt, options)
    applyConvexCsp(nuxt, url, siteUrl)
  },
})

/**
 * Enable the opt-in integrations, auto-detected when their package is installed
 * (the explicit option wins when set). Mirrors how `@convex-dev/better-auth` and
 * `@convex-dev/polar` are separate upstream packages — here they light up
 * automatically so the consumer keeps a single `modules` entry.
 */
function registerIntegrations(resolver: Resolver, nuxt: Nuxt, options: ModuleOptions): void {
  const enableBetterAuth = options.betterAuth ?? isPackageInstalled('@convex-dev/better-auth', nuxt.options.rootDir)
  if (enableBetterAuth) {
    // Better Auth's client/SSR plugins create *and* provide the Convex client
    // (alongside session hydration), so it owns client provisioning here.
    registerBetterAuth(resolver, options.authRoute || '/api/auth')
  }
  else {
    // No auth integration manages the client — provide a base one so the data
    // composables and the Clerk / Auth0 adapters can resolve it via useConvex().
    registerBaseConvexClient(resolver)
  }

  const enableClerk = options.clerk ?? isPackageInstalled('@clerk/vue', nuxt.options.rootDir)
  if (enableClerk) {
    registerClerk(resolver)
  }

  const enableAuth0 = options.auth0 ?? isPackageInstalled('@auth0/auth0-vue', nuxt.options.rootDir)
  if (enableAuth0) {
    registerAuth0(resolver)
  }

  const enablePolar = options.polar ?? isPackageInstalled('@convex-dev/polar', nuxt.options.rootDir)
  if (enablePolar) {
    registerPolarComponents(resolver)
  }
}

/**
 * Ship a tightened, Convex-aware CSP by default. Only in production builds (a
 * strict connect-src would break Vite HMR / devtools in `nuxt dev`) and only
 * when a build-time Convex URL is known (otherwise we'd lock Convex out instead
 * of allowing it). nuxt-security is installed afterwards via moduleDependencies,
 * so mutating its config here lands before it reads it.
 */
function applyConvexCsp(nuxt: Nuxt, url: string, siteUrl: string): void {
  const opts = nuxt.options as unknown as Record<string, unknown>
  if (!url || nuxt.options.dev || opts.security === false) return
  const security = (opts.security ??= {}) as Record<string, unknown>
  applyConvexSecurityDefaults(security, convexConnectSrc(url, siteUrl), convexResourceSrc(url))
}

/**
 * Whether a package is resolvable from the consumer app (or, as a fallback,
 * from this module) — used to auto-enable the optional Better Auth / Polar
 * integrations without making the user list extra modules.
 */
function isPackageInstalled(id: string, rootDir: string): boolean {
  for (const base of [join(rootDir, 'package.json'), import.meta.url]) {
    const require = createRequire(base)
    for (const target of [id, `${id}/package.json`]) {
      try {
        require.resolve(target)
        return true
      }
      catch {
        // Not resolvable from this base — try the next target/base.
      }
    }
  }
  return false
}

/**
 * Resolve the Convex deployment URL from module options or environment, and
 * publish `backend.url` / `backend.siteUrl` into Nuxt's runtime config.
 */
function applyRuntimeConfig(nuxt: Nuxt, options: ModuleOptions): { url: string, siteUrl: string } {
  const url = nuxt.options._prepare
    ? undefined
    : options.url || process.env.NUXT_PUBLIC_CONVEX_URL

  if (!url && !nuxt.options._prepare) {
    console.warn('[nuxt-convex] No Convex URL configured. Set `convex.url` in nuxt.config or NUXT_PUBLIC_CONVEX_URL.')
  }

  const siteUrl = options.siteUrl || process.env.NUXT_PUBLIC_CONVEX_SITE_URL || ''

  nuxt.options.runtimeConfig.public.backend = {
    url: url || '',
    siteUrl,
  }
  nuxt.options.runtimeConfig.backend = { siteUrl }

  return { url: url || '', siteUrl }
}

/**
 * Build the ordered import-alias map for the Convex backend folder and its
 * generated modules, so user code and server routes can `import from
 * '#backend/...'` without spelling out `_generated`.
 *
 * - `#backend/api`        -> _generated/api        (`api`, `internal`, `components`)
 * - `#backend/server`     -> _generated/server     (`query`, `mutation`, `action`, `*Ctx`, ...)
 * - `#backend/dataModel`  -> _generated/dataModel  (`DataModel`, `Doc`, `Id`, `TableNames`)
 * - `#backend/_generated` -> _generated            (long form, covers every generated file)
 * - `#backend`            -> <rootDir>/<functionsDir>
 *
 * Order is significant: both Vite and Nitro resolve aliases with
 * `@rollup/plugin-alias`, which is first-match-wins and treats `#backend` as a
 * prefix of `#backend/api`. The specific generated-module aliases must come
 * before the catch-all `#backend`, otherwise `#backend/api` would resolve to
 * `<functionsDir>/api` instead of `<functionsDir>/_generated/api` (and would
 * shadow any user function file literally named `api.ts` / `server.ts`).
 */
export function getBackendAliases(rootDir: string): Record<string, string> {
  const functionsDir = resolveFunctionsDir(rootDir)
  const backendDir = join(rootDir, functionsDir)
  const generatedDir = join(backendDir, '_generated')

  return {
    '#backend/api': join(generatedDir, 'api'),
    '#backend/server': join(generatedDir, 'server'),
    '#backend/dataModel': join(generatedDir, 'dataModel'),
    '#backend/_generated': generatedDir,
    '#backend': backendDir,
  }
}

/**
 * Register the backend import aliases for both Vite (`options.alias`) and Nitro
 * (`nitro.alias`). Iterates {@link getBackendAliases} in declaration order to
 * preserve the specific-before-general ordering the alias resolvers depend on.
 */
function registerBackendAliases(nuxt: Nuxt): void {
  const aliases = getBackendAliases(nuxt.options.rootDir)

  nuxt.options.nitro ||= {}
  nuxt.options.nitro.alias ||= {}

  for (const [alias, target] of Object.entries(aliases)) {
    nuxt.options.alias[alias] = target
    nuxt.options.nitro.alias[alias] = target
  }
}

/**
 * Auto-provide the generated Convex `api` (`#backend/api`) app-wide so the
 * composables and components that read from a namespace (e.g. the Polar
 * `<CheckoutLink>`) work with zero arguments — see `runtime/vue/provide.ts`.
 * Runs on both server and client.
 *
 * Generated as a template so we can fs-guard it: before `convex dev` has emitted
 * `_generated/api`, the import would fail the build, so we emit a no-op plugin
 * instead (features fall back to graceful no-ops). The plugin is regenerated
 * with the real wiring on the next build once codegen has run.
 */
function registerBackendApiPlugin(resolver: Resolver, nuxt: Nuxt): void {
  const functionsDir = resolveFunctionsDir(nuxt.options.rootDir)
  const generatedApi = join(nuxt.options.rootDir, functionsDir, '_generated', 'api')
  const provideModule = resolver.resolve('./runtime/vue/provide')

  addPluginTemplate({
    filename: 'nuxt-convex-provide-api.mjs',
    getContents: () => {
      const hasApi = existsSync(`${generatedApi}.d.ts`) || existsSync(`${generatedApi}.js`)
      if (!hasApi) {
        return 'import { defineNuxtPlugin } from \'#app\'\nexport default defineNuxtPlugin(() => {})\n'
      }
      return [
        'import { defineNuxtPlugin } from \'#app\'',
        'import { api } from \'#backend/api\'',
        `import { provideBackendApi } from ${JSON.stringify(provideModule)}`,
        'export default defineNuxtPlugin((nuxtApp) => {',
        '  provideBackendApi(api, nuxtApp.vueApp)',
        '})',
        '',
      ].join('\n')
    },
  })
}

/**
 * Expose the core Vue composables (`useQuery`, `useMutation`, `useAction`,
 * pagination, file storage, generic auth state, preloaded-query helpers, ...)
 * as Nuxt auto-imports. Auth-provider composables (Better Auth) and billing
 * (Polar) are registered by their auto-enabled integrations below.
 */
function registerVueComposables(resolver: Resolver): void {
  const composables: Array<{ name: string, from: string }> = [
    { name: 'useConvex', from: resolver.resolve('./runtime/vue/client') },
    { name: 'useQuery', from: resolver.resolve('./runtime/vue/composables/use-query') },
    { name: 'useQuery_experimental', from: resolver.resolve('./runtime/vue/composables/use-query') },
    { name: 'useConvexQuery', from: resolver.resolve('./runtime/vue/composables/use-query') },
    { name: 'useQueries', from: resolver.resolve('./runtime/vue/composables/use-queries') },
    { name: 'useConvexQueries', from: resolver.resolve('./runtime/vue/composables/use-queries') },
    { name: 'useMutation', from: resolver.resolve('./runtime/vue/composables/use-mutation') },
    { name: 'useConvexMutation', from: resolver.resolve('./runtime/vue/composables/use-mutation') },
    { name: 'useAction', from: resolver.resolve('./runtime/vue/composables/use-action') },
    { name: 'useConvexAction', from: resolver.resolve('./runtime/vue/composables/use-action') },
    { name: 'useConvexConnectionState', from: resolver.resolve('./runtime/vue/composables/use-connection-state') },
    { name: 'useUpload', from: resolver.resolve('./runtime/vue/composables/use-upload') },
    { name: 'useConvexUpload', from: resolver.resolve('./runtime/vue/composables/use-upload') },
    { name: 'uploadFile', from: resolver.resolve('./runtime/vue/composables/use-upload') },
    { name: 'useUploadQueue', from: resolver.resolve('./runtime/vue/composables/use-upload-queue') },
    { name: 'useConvexUploadQueue', from: resolver.resolve('./runtime/vue/composables/use-upload-queue') },
    { name: 'useStorageUrl', from: resolver.resolve('./runtime/vue/composables/use-storage-url') },
    { name: 'useConvexStorageUrl', from: resolver.resolve('./runtime/vue/composables/use-storage-url') },
    { name: 'useConvexAuth', from: resolver.resolve('./runtime/vue/auth/index') },
    { name: 'provideConvexAuth', from: resolver.resolve('./runtime/vue/auth/index') },
    { name: 'provideBackendApi', from: resolver.resolve('./runtime/vue/provide') },
    { name: 'useBackendApi', from: resolver.resolve('./runtime/vue/provide') },
    { name: 'useBackendNamespace', from: resolver.resolve('./runtime/vue/provide') },
    { name: 'usePreloadedQuery', from: resolver.resolve('./runtime/vue/hydration') },
    { name: 'usePaginatedQuery', from: resolver.resolve('./runtime/vue/composables/use-paginated-query') },
    { name: 'usePaginatedQuery_experimental', from: resolver.resolve('./runtime/vue/composables/use-paginated-query') },
  ]
  for (const composable of composables) {
    addImports(composable)
  }
}

/**
 * Auto-register the low-level Convex auth helper components so users can drop
 * `<Authenticated>`, `<Unauthenticated>`, `<AuthLoading>`, and
 * `<AuthRefreshing>` straight into templates — mirroring the React
 * integration's exports.
 */
function registerAuthComponents(resolver: Resolver): void {
  const helpersFile = resolver.resolve('./runtime/vue/auth/helpers')
  for (const name of ['Authenticated', 'Unauthenticated', 'AuthLoading', 'AuthRefreshing'] as const) {
    addComponent({ name, filePath: helpersFile, export: name })
  }
}

/**
 * Expose server-side utilities (`fetchQuery`, `preloadQuery`, ...) as Nitro
 * server auto-imports for use inside server routes and SSR.
 */
function registerServerImports(resolver: Resolver): void {
  const fromNuxt = resolver.resolve('./runtime/nuxt/index')
  const serverUtils = ['fetchQuery', 'fetchMutation', 'fetchAction', 'preloadQuery', 'preloadedQueryResult']
  addServerImports(serverUtils.map(name => ({ name, from: fromNuxt })))
}

/**
 * Wire the Better Auth integration (a Vue/Nuxt port of `@convex-dev/better-auth`'s
 * `react` + `nextjs` integration): the client/SSR auth plugins, the
 * `${authRoute}/**` same-origin proxy, the opt-in `auth` route middleware, the
 * `useAuth` / `usePreloadedAuthQuery` composables, and the `backendAuth(event)`
 * server helper.
 */
function registerBetterAuth(resolver: Resolver, authRoute: string): void {
  addPlugin(resolver.resolve('./runtime/better-auth/vue/plugin.client'))
  addPlugin(resolver.resolve('./runtime/better-auth/vue/plugin.server'))

  addImports([
    { name: 'useAuth', from: resolver.resolve('./runtime/better-auth/vue/use-auth') },
    { name: 'usePreloadedAuthQuery', from: resolver.resolve('./runtime/better-auth/vue/hydration') },
  ])

  addComponent({
    name: 'AuthBoundary',
    filePath: resolver.resolve('./runtime/better-auth/vue/auth-boundary'),
    export: 'AuthBoundary',
  })

  addServerHandler({
    route: `${authRoute}/**`,
    handler: resolver.resolve('./runtime/better-auth/nuxt/proxy'),
  })
  addRouteMiddleware({
    name: 'auth',
    path: resolver.resolve('./runtime/better-auth/nuxt/middleware'),
    global: false,
  })

  addServerImports([
    { name: 'backendAuth', from: resolver.resolve('./runtime/better-auth/nuxt/server') },
  ])
}

/**
 * Provide a plain Convex client app-wide (server + client) when no auth
 * integration is managing it. Mirrors the client-provisioning half of Better
 * Auth's plugins so the data layer works on its own — see `runtime/vue/plugin`.
 */
function registerBaseConvexClient(resolver: Resolver): void {
  addPlugin(resolver.resolve('./runtime/vue/plugin'))
}

/**
 * Wire the Clerk auth adapter (a Vue/Nuxt port of `convex/react-clerk`): the
 * `provideConvexAuthFromClerk` composable and the `<ConvexProviderWithClerk>`
 * drop-in component. Both reuse the generic `provideConvexAuth` primitive.
 */
function registerClerk(resolver: Resolver): void {
  const from = resolver.resolve('./runtime/clerk/vue/index')
  addImports({ name: 'provideConvexAuthFromClerk', from })
  addComponent({ name: 'ConvexProviderWithClerk', filePath: from, export: 'ConvexProviderWithClerk' })
}

/**
 * Wire the Auth0 auth adapter (a Vue/Nuxt port of `convex/react-auth0`): the
 * `provideConvexAuthFromAuth0` composable and the `<ConvexProviderWithAuth0>`
 * drop-in component. Both reuse the generic `provideConvexAuth` primitive.
 */
function registerAuth0(resolver: Resolver): void {
  const from = resolver.resolve('./runtime/auth0/vue/index')
  addImports({ name: 'provideConvexAuthFromAuth0', from })
  addComponent({ name: 'ConvexProviderWithAuth0', filePath: from, export: 'ConvexProviderWithAuth0' })
}

/**
 * Register the Polar billing components (`<CheckoutLink>` / `<CustomerPortalLink>`,
 * Vue ports of `@convex-dev/polar/react`) as global components.
 */
function registerPolarComponents(resolver: Resolver): void {
  const componentsFile = resolver.resolve('./runtime/polar/vue/components')
  for (const name of ['CheckoutLink', 'CustomerPortalLink'] as const) {
    addComponent({ name, filePath: componentsFile, export: name })
  }
}

function toHttpOrigin(raw?: string): string | undefined {
  if (!raw) return undefined
  try {
    return new URL(raw).origin
  }
  catch {
    return undefined
  }
}

function toWsOrigin(raw?: string): string | undefined {
  if (!raw) return undefined
  try {
    const u = new URL(raw)
    return `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`
  }
  catch {
    return undefined
  }
}

function uniq(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))))
}

/**
 * CSP `connect-src` entries the browser needs to reach a Convex backend: the
 * deployment URL over both HTTPS and WebSocket (the realtime sync channel) and,
 * when configured, the `.site` URL that serves Convex HTTP actions. Returns
 * `[]` for empty or unparseable input.
 */
export function convexConnectSrc(url?: string, siteUrl?: string): string[] {
  return uniq([toHttpOrigin(url), toWsOrigin(url), toHttpOrigin(siteUrl), toWsOrigin(siteUrl)])
}

/**
 * CSP source for Convex-served resources (`img-src` / `media-src`): files
 * uploaded through `useStorageUrl()` are served from the deployment origin.
 */
export function convexResourceSrc(url?: string): string[] {
  return uniq([toHttpOrigin(url)])
}

/**
 * Apply nuxt-convex's secure-by-default, Convex-aware CSP onto a security config
 * object (mutated in place). This tightens the directives we can safely
 * pre-fill — locking network egress and Convex-served media to same-origin plus
 * the Convex deployment — while leaving every other directive (script/style/
 * font, etc.) to nuxt-security's own defaults.
 *
 * For each directive we keep any value the user already set and *append* the
 * Convex origins, so consumers extend (add their own third parties) rather than
 * fight the defaults, and the Convex origins are always present. A user who sets
 * `contentSecurityPolicy: false` (CSP disabled) is left untouched.
 */
export function applyConvexSecurityDefaults(
  security: Record<string, unknown>,
  connectSrc: string[],
  resourceSrc: string[],
): void {
  if (security.headers === false) return
  if (typeof security.headers !== 'object' || security.headers === null) security.headers = {}
  const headers = security.headers as Record<string, unknown>

  if (headers.contentSecurityPolicy === false) return // CSP explicitly disabled.
  if (typeof headers.contentSecurityPolicy !== 'object' || headers.contentSecurityPolicy === null) {
    headers.contentSecurityPolicy = {}
  }
  const csp = headers.contentSecurityPolicy as Record<string, unknown>

  tightenDirective(csp, 'connect-src', ['\'self\''], connectSrc)
  tightenDirective(csp, 'img-src', ['\'self\'', 'data:'], resourceSrc)
  tightenDirective(csp, 'media-src', ['\'self\''], resourceSrc)
}

/**
 * Set a CSP directive to the union of its existing value (or `baseline` if it
 * was unset) and `additions`, deduplicated and order-preserving.
 */
function tightenDirective(csp: Record<string, unknown>, name: string, baseline: string[], additions: string[]): void {
  const existing = Array.isArray(csp[name]) ? csp[name] as string[] : baseline
  csp[name] = uniq([...existing, ...additions])
}
