import { defineNuxtModule, addPlugin, addPluginTemplate, addImports, addServerHandler, addServerImports, addRouteMiddleware, addComponent, addTypeTemplate, createResolver, useLogger, updateRuntimeConfig, updateTemplates, extendRouteRules, type Resolver } from '@nuxt/kit'
import { isAbsolute, join } from 'node:path'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Nuxt } from '@nuxt/schema'
import { hasGeneratedApi, resolveFunctionsDir } from './functions-dir'

/** Scoped, silenceable build-time logger (consola) for this module. */
const logger = useLogger('nuxt-convex-module')

/**
 * Configuration for the opt-in Better Auth integration.
 *
 * @public
 */
export interface BetterAuthModuleOptions {
  /**
   * Path (relative to the Nuxt `rootDir`, or absolute) to a module that exports
   * your configured Better Auth client as `authClient` — and, ideally, its type
   * as `AuthClient`. Mirrors `convex/react`'s "you own the `authClient`" model:
   * include whatever client plugins you need, e.g. `emailOTPClient()`,
   * `passkeyClient()`, or `crossDomainClient()` from
   * `@convex-dev/better-auth/client/plugins` for cross-domain auth. Defaults to
   * a minimal bundled client carrying only `convexClient()` — the one plugin
   * the integration itself requires.
   *
   * @example './app/convex-auth-client'
   */
  authClient?: string
}

export interface ModuleOptions {
  /** Convex deployment URL (defaults to `NUXT_PUBLIC_CONVEX_URL`). */
  url?: string
  /** Convex `.site` URL (defaults to `NUXT_PUBLIC_CONVEX_SITE_URL`). */
  siteUrl?: string
  /**
   * Better Auth integration. Auto-enabled when `@convex-dev/better-auth` is
   * installed; set `false` to force it off, `true` to require it, or a
   * {@link BetterAuthModuleOptions} object to point at a custom auth client.
   */
  betterAuth?: boolean | BetterAuthModuleOptions
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
  /**
   * Convex panel in Nuxt DevTools (dev only): connection state, live query
   * subscriptions, auth state, and client logs. Enabled by default whenever
   * Nuxt DevTools is; set `false` to disable just the Convex tab.
   */
  devtools?: boolean
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    convex: {
      siteUrl: string
    }
  }
  interface PublicRuntimeConfig {
    convex: {
      url: string
      siteUrl: string
    }
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-convex-module',
    configKey: 'convex',
    // Surfaced by Nuxt DevTools and the nuxt/modules registry. Point at the
    // deployed docs site once it ships.
    docs: 'https://github.com/qruto/nuxt-convex-module#readme',
    // `moduleDependencies` (below) is a Nuxt >= 4.1 feature — fail fast with a
    // clear kit error on older Nuxt instead of silently skipping nuxt-security.
    compatibility: {
      nuxt: '>=4.1.0',
    },
  },
  defaults: {
    authRoute: '/api/auth',
    devtools: true,
  },
  // nuxt-security is an integral part of the integration: declaring it as a
  // module dependency makes Nuxt's core loader install it (hoisting its types
  // and deduping if you also register it yourself), and guarantees our setup
  // runs *before* it — so the Convex-aware CSP defaults below land before
  // nuxt-security reads its config. Configure it via the `security` key.
  moduleDependencies: {
    'nuxt-security': {},
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const { url, siteUrl } = applyRuntimeConfig(nuxt, options)

    const diagnostics = validateModuleOptions({
      url,
      siteUrl,
      authRoute: options.authRoute || '/api/auth',
      authClient: typeof options.betterAuth === 'object' ? options.betterAuth.authClient : undefined,
      rootDir: nuxt.options.rootDir,
    })
    for (const message of diagnostics.errors) logger.error(message)
    for (const message of diagnostics.warnings) logger.warn(message)
    options.authRoute = diagnostics.authRoute

    registerConvexAliases(nuxt)
    registerAuthClientAlias(resolver, nuxt, options)

    registerConvexApiPlugin(resolver, nuxt)
    registerConvexTypeFallback(nuxt)
    registerVueComposables(resolver)
    registerAuthComponents(resolver)
    registerServerImports(resolver)
    const integrations = registerIntegrations(resolver, nuxt, options)
    applyConvexCsp(nuxt, url, siteUrl)
    watchConvexCodegen(nuxt)

    if (nuxt.options.dev && options.devtools !== false && isDevtoolsUiEnabled(nuxt)) {
      // Lazy import keeps @nuxt/devtools-kit out of production module evaluation.
      const { setupDevtools } = await import('./devtools/index')
      setupDevtools(resolver, nuxt, {
        url,
        siteUrl,
        rootDir: nuxt.options.rootDir,
        functionsDir: resolveFunctionsDir(nuxt.options.rootDir),
        integrations,
      })
      // Appended so it runs after whichever plugin provides the Convex client.
      addPlugin({ src: resolver.resolve('./runtime/devtools/plugin.client'), mode: 'client' }, { append: true })
    }

    if (nuxt.options.dev && !nuxt.options._prepare) {
      logger.info(formatStartupSummary(url, resolveFunctionsDir(nuxt.options.rootDir), integrations))
    }
  },
})

/** Whether the Nuxt DevTools UI itself is enabled for this app. */
function isDevtoolsUiEnabled(nuxt: Nuxt): boolean {
  const devtools = nuxt.options.devtools as boolean | { enabled?: boolean } | undefined
  return typeof devtools === 'boolean' ? devtools : devtools?.enabled !== false
}

/**
 * Which opt-in integrations ended up enabled — returned by
 * {@link registerIntegrations} for the dev startup summary (and the DevTools
 * panel, which reports the active adapter).
 */
export interface IntegrationFlags {
  betterAuth: boolean
  clerk: boolean
  auth0: boolean
  polar: boolean
}

/**
 * Decide whether an opt-in integration is enabled, distinguishing the
 * misconfiguration case: explicitly enabled but the backing package is not
 * installed (`missingPackage`), where silently registering the runtime would
 * surface as an opaque Vite import error instead of an actionable message.
 * Auto-detection (option unset) treats package absence as the normal case.
 */
export function resolveIntegrationState(
  explicit: boolean | object | undefined,
  installed: boolean,
): { enabled: boolean, missingPackage: boolean } {
  if (explicit === false) return { enabled: false, missingPackage: false }
  if (explicit === undefined) return { enabled: installed, missingPackage: false }
  return installed
    ? { enabled: true, missingPackage: false }
    : { enabled: false, missingPackage: true }
}

/** Result of {@link validateModuleOptions}: findings plus normalized values. */
export interface ModuleOptionDiagnostics {
  errors: string[]
  warnings: string[]
  /** `authRoute` with a leading slash ensured and any trailing slash stripped. */
  authRoute: string
}

/**
 * Validate the resolved module configuration, turning silent misconfiguration
 * (swapped `.convex.cloud`/`.convex.site` URLs, malformed URLs, an `authRoute`
 * that would produce a broken server-handler route, a `betterAuth.authClient`
 * path that doesn't exist) into actionable messages. Pure — the caller logs
 * the findings and applies the normalized `authRoute`. Exported for tests.
 */
export function validateModuleOptions(input: {
  url: string
  siteUrl: string
  authRoute: string
  authClient?: string
  rootDir: string
}): ModuleOptionDiagnostics {
  const errors: string[] = []
  const warnings: string[] = []

  if (input.url && input.url.endsWith('.convex.site')) {
    errors.push(
      `\`convex.url\` ("${input.url}") ends with .convex.site, which is the HTTP Actions domain — deployment URLs end with .convex.cloud. Did you mean to set \`convex.siteUrl\`?`,
    )
  }
  else if (input.url && !isHttpUrl(input.url)) {
    warnings.push(
      `\`convex.url\` ("${input.url}") does not look like a valid http(s) URL — Convex clients will fail to connect.`,
    )
  }

  if (input.siteUrl && input.siteUrl.endsWith('.convex.cloud')) {
    warnings.push(
      `\`convex.siteUrl\` ("${input.siteUrl}") ends with .convex.cloud, which is the deployment domain — site URLs (HTTP Actions) end with .convex.site. Did you swap it with \`convex.url\`?`,
    )
  }
  else if (input.siteUrl && !isHttpUrl(input.siteUrl)) {
    warnings.push(
      `\`convex.siteUrl\` ("${input.siteUrl}") does not look like a valid http(s) URL.`,
    )
  }

  let authRoute = input.authRoute
  if (!authRoute.startsWith('/')) {
    authRoute = `/${authRoute}`
    warnings.push(
      `\`convex.authRoute\` ("${input.authRoute}") must start with "/" — using "${authRoute}".`,
    )
  }
  if (authRoute.length > 1 && authRoute.endsWith('/')) {
    authRoute = authRoute.replace(/\/+$/, '')
  }

  if (input.authClient && !authClientModuleExists(input.authClient, input.rootDir)) {
    errors.push(
      `\`convex.betterAuth.authClient\` points at "${input.authClient}", which does not exist (resolved against \`${input.rootDir}\`). The build would fail with an opaque import error — fix the path or remove the option to use the bundled client.`,
    )
  }

  return { errors, warnings, authRoute }
}

function isHttpUrl(value: string): boolean {
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return false
  }
  try {
    new URL(value)
    return true
  }
  catch {
    return false
  }
}

/**
 * Whether the custom `betterAuth.authClient` module exists on disk — probing
 * the common module extensions since the option (an import specifier) may
 * omit one.
 */
function authClientModuleExists(authClient: string, rootDir: string): boolean {
  const base = isAbsolute(authClient) ? authClient : join(rootDir, authClient)
  return ['', '.ts', '.js', '.mts', '.mjs', '/index.ts', '/index.js'].some(
    suffix => existsSync(`${base}${suffix}`),
  )
}

/**
 * The dev-mode one-line startup summary: resolved deployment URL, functions
 * directory, and which opt-in integrations are active.
 */
export function formatStartupSummary(url: string, functionsDir: string, integrations: IntegrationFlags): string {
  const names: Record<keyof IntegrationFlags, string> = {
    betterAuth: 'better-auth',
    clerk: 'clerk',
    auth0: 'auth0',
    polar: 'polar',
  }
  const enabled = (Object.keys(names) as Array<keyof IntegrationFlags>)
    .filter(key => integrations[key])
    .map(key => names[key])
  return `Convex ${url || '(no URL)'} · functions: ${functionsDir}/ · integrations: ${enabled.join(', ') || 'none'}`
}

/**
 * Enable the opt-in integrations, auto-detected when their package is installed
 * (the explicit option wins when set). Mirrors how `@convex-dev/better-auth` and
 * `@convex-dev/polar` are separate upstream packages — here they light up
 * automatically so the consumer keeps a single `modules` entry.
 */
function registerIntegrations(resolver: Resolver, nuxt: Nuxt, options: ModuleOptions): IntegrationFlags {
  const resolve = (key: keyof IntegrationFlags & keyof ModuleOptions, pkg: string): boolean => {
    const state = resolveIntegrationState(options[key], isPackageInstalled(pkg, nuxt.options.rootDir))
    if (state.missingPackage) {
      logger.error(`\`convex.${key}\` is enabled but \`${pkg}\` is not installed. Run \`npm install ${pkg}\` or remove the option.`)
    }
    return state.enabled
  }

  const betterAuth = resolve('betterAuth', '@convex-dev/better-auth')
  if (betterAuth) {
    // Better Auth's client/SSR plugins create *and* provide the Convex client
    // (alongside session hydration), so it owns client provisioning here.
    registerBetterAuth(resolver, options.authRoute || '/api/auth')
  }
  else {
    // No auth integration manages the client — provide a base one so the data
    // composables and the Clerk / Auth0 adapters can resolve it via useConvex().
    registerBaseConvexClient(resolver)
  }

  const clerk = resolve('clerk', '@clerk/vue')
  if (clerk) {
    registerClerk(resolver)
  }

  const auth0 = resolve('auth0', '@auth0/auth0-vue')
  if (auth0) {
    registerAuth0(resolver)
  }

  const polar = resolve('polar', '@convex-dev/polar')
  if (polar) {
    registerPolarComponents(resolver)
  }

  return { betterAuth, clerk, auth0, polar }
}

/**
 * Ship a tightened, Convex-aware CSP by default. `connect-src` is tightened
 * only in production builds — creating it in dev would break the Vite HMR and
 * devtools WebSockets, which run on their own ports that `'self'` doesn't
 * cover, while nuxt-security's defaults leave `connect-src` unset (open). The
 * resource directives (`img-src` / `media-src`) are widened in dev too:
 * nuxt-security enforces its default `img-src 'self' data:` during `nuxt dev`
 * as well, which would block files served from Convex storage. Applies only
 * when a build-time Convex URL is known (otherwise we'd lock Convex out
 * instead of allowing it). nuxt-security is installed afterwards via
 * moduleDependencies, so mutating its config here lands before it reads it.
 */
function applyConvexCsp(nuxt: Nuxt, url: string, siteUrl: string): void {
  const opts = nuxt.options as unknown as Record<string, unknown>
  if (!url || opts.security === false) return
  const security = (opts.security ??= {}) as Record<string, unknown>
  applyConvexSecurityDefaults(
    security,
    nuxt.options.dev ? [] : convexConnectSrc(url, siteUrl),
    convexResourceSrc(url),
  )
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
 * publish `convex.url` / `convex.siteUrl` into Nuxt's runtime config.
 */
function applyRuntimeConfig(nuxt: Nuxt, options: ModuleOptions): { url: string, siteUrl: string } {
  const url = nuxt.options._prepare
    ? undefined
    : options.url || process.env.NUXT_PUBLIC_CONVEX_URL

  if (!url && !nuxt.options._prepare) {
    logger.warn(
      'No Convex deployment URL configured. Set NUXT_PUBLIC_CONVEX_URL or `convex.url` in nuxt.config. '
      + 'Note: `npx convex dev` writes CONVEX_URL to .env.local, which Nuxt does not load.',
    )
  }

  const siteUrl = options.siteUrl || process.env.NUXT_PUBLIC_CONVEX_SITE_URL || ''

  // Kit-blessed merge: publishes the resolved convex url/siteUrl while
  // preserving any sibling keys a user already set, instead of overwriting the
  // whole `convex` object as a direct assignment would.
  updateRuntimeConfig({
    public: { convex: { url: url || '', siteUrl } },
    convex: { siteUrl },
  })

  return { url: url || '', siteUrl }
}

/**
 * Build the ordered import-alias map for the Convex functions folder and its
 * generated modules, so user code and server routes can `import from
 * '#convex/...'` without spelling out `_generated`.
 *
 * - `#convex/api`        -> _generated/api        (`api`, `internal`, `components`)
 * - `#convex/server`     -> _generated/server     (`query`, `mutation`, `action`, `*Ctx`, ...)
 * - `#convex/dataModel`  -> _generated/dataModel  (`DataModel`, `Doc`, `Id`, `TableNames`)
 * - `#convex/_generated` -> _generated            (long form, covers every generated file)
 * - `#convex`            -> <rootDir>/<functionsDir>
 *
 * Order is significant: both Vite and Nitro resolve aliases with
 * `@rollup/plugin-alias`, which is first-match-wins and treats `#convex` as a
 * prefix of `#convex/api`. The specific generated-module aliases must come
 * before the catch-all `#convex`, otherwise `#convex/api` would resolve to
 * `<functionsDir>/api` instead of `<functionsDir>/_generated/api` (and would
 * shadow any user function file literally named `api.ts` / `server.ts`).
 */
export function getConvexAliases(rootDir: string): Record<string, string> {
  const functionsDir = resolveFunctionsDir(rootDir)
  const convexDir = join(rootDir, functionsDir)
  const generatedDir = join(convexDir, '_generated')

  return {
    '#convex/api': join(generatedDir, 'api'),
    '#convex/server': join(generatedDir, 'server'),
    '#convex/dataModel': join(generatedDir, 'dataModel'),
    '#convex/_generated': generatedDir,
    '#convex': convexDir,
  }
}

/**
 * Register the Convex import aliases for both Vite (`options.alias`) and Nitro
 * (`nitro.alias`). Iterates {@link getConvexAliases} in declaration order to
 * preserve the specific-before-general ordering the alias resolvers depend on.
 */
function registerConvexAliases(nuxt: Nuxt): void {
  const aliases = getConvexAliases(nuxt.options.rootDir)

  nuxt.options.nitro ||= {}
  nuxt.options.nitro.alias ||= {}

  for (const [alias, target] of Object.entries(aliases)) {
    nuxt.options.alias[alias] = target
    nuxt.options.nitro.alias[alias] = target
  }
}

/**
 * Register the `#convex/auth-client` alias used by the Better Auth runtime
 * (`use-auth`, `auth-boundary`, `cross-domain`) to resolve the app's Better Auth
 * client. This is the Vue/Nuxt analog of `convex/react` taking the `authClient`
 * as a prop: point `convex.betterAuth.authClient` at your own client module to
 * choose your plugins (e.g. add `crossDomainClient()` for cross-domain auth),
 * otherwise it resolves to the bundled default client.
 *
 * Registered unconditionally (not gated on the integration being enabled) so the
 * library's own type-check always resolves the alias, and on both Vite
 * (`options.alias`) and Nitro (`nitro.alias`).
 */
function registerAuthClientAlias(resolver: Resolver, nuxt: Nuxt, options: ModuleOptions): void {
  const custom = typeof options.betterAuth === 'object' ? options.betterAuth.authClient : undefined
  const target = custom
    ? (isAbsolute(custom) ? custom : join(nuxt.options.rootDir, custom))
    : resolver.resolve('./runtime/better-auth/vue/client')

  nuxt.options.nitro ||= {}
  nuxt.options.nitro.alias ||= {}
  nuxt.options.alias['#convex/auth-client'] = target
  nuxt.options.nitro.alias['#convex/auth-client'] = target
}

/**
 * Auto-provide the generated Convex `api` (`#convex/api`) app-wide so the
 * composables and components that read from a namespace (e.g. the Polar
 * `<CheckoutLink>`) work with zero arguments — see `runtime/vue/provide.ts`.
 * Runs on both server and client.
 *
 * Generated as a template so we can fs-guard it: before `convex dev` has emitted
 * `_generated/api`, the import would fail the build, so we emit a no-op plugin
 * instead (features fall back to graceful no-ops). The plugin is regenerated
 * with the real wiring on the next build once codegen has run.
 */
function registerConvexApiPlugin(resolver: Resolver, nuxt: Nuxt): void {
  const functionsDir = resolveFunctionsDir(nuxt.options.rootDir)
  const provideModule = resolver.resolve('./runtime/vue/provide')
  // One-shot onboarding notice: point at `npx convex dev` while codegen is
  // absent, and confirm (once) when the watcher re-renders with it present.
  let notifiedMissing = false

  addPluginTemplate({
    filename: 'nuxt-convex-module-provide-api.mjs',
    getContents: () => {
      if (!hasGeneratedApi(nuxt.options.rootDir, functionsDir)) {
        if (nuxt.options.dev && !nuxt.options._prepare && !notifiedMissing) {
          notifiedMissing = true
          logger.info(`Convex codegen not found in \`${functionsDir}/_generated\` — run \`npx convex dev\`. Convex features no-op until it exists.`)
        }
        return 'import { defineNuxtPlugin } from \'#app\'\nexport default defineNuxtPlugin(() => {})\n'
      }
      if (notifiedMissing) {
        notifiedMissing = false
        logger.success('Convex codegen detected — generated `api` wired app-wide.')
      }
      return [
        'import { defineNuxtPlugin } from \'#app\'',
        'import { api } from \'#convex/api\'',
        `import { provideConvexApi } from ${JSON.stringify(provideModule)}`,
        'export default defineNuxtPlugin((nuxtApp) => {',
        '  provideConvexApi(api, nuxtApp.vueApp)',
        '})',
        '',
      ].join('\n')
    },
  })
}

/**
 * Contents of the fallback type template: placeholder (`any`-typed) ambient
 * declarations for the generated `#convex/*` modules while `convex dev`
 * hasn't emitted codegen yet, so a fresh project typechecks instead of failing
 * on every `#convex/api` import. Once codegen exists the template goes empty
 * and the real generated types win via the tsconfig `paths` the aliases
 * already produce.
 */
export function convexTypeFallbackContents(hasApi: boolean, functionsDir: string): string {
  if (hasApi) {
    // Real codegen resolves through the tsconfig paths — declare nothing so
    // the generated types are the only source of truth.
    return 'export {}\n'
  }
  return [
    `// Placeholder until \`npx convex dev\` generates ${functionsDir}/_generated.`,
    'declare module \'#convex/api\' {',
    '  export const api: any',
    '  export const internal: any',
    '  export const components: any',
    '}',
    'declare module \'#convex/server\' {',
    '  export const query: any',
    '  export const internalQuery: any',
    '  export const mutation: any',
    '  export const internalMutation: any',
    '  export const action: any',
    '  export const internalAction: any',
    '  export const httpAction: any',
    '  export type QueryCtx = any',
    '  export type MutationCtx = any',
    '  export type ActionCtx = any',
    '  export type DatabaseReader = any',
    '  export type DatabaseWriter = any',
    '}',
    'declare module \'#convex/dataModel\' {',
    '  export type Doc<TableName extends string = string> = any',
    '  export type Id<TableName extends string = string> = string',
    '  export type DataModel = any',
    '  export type TableNames = string',
    '}',
    '',
  ].join('\n')
}

/**
 * Register the fs-guarded fallback type template (app + nitro contexts, since
 * server routes import `#convex/api` too). Symmetric to
 * {@link registerConvexApiPlugin}'s runtime no-op guard, and re-rendered by
 * {@link watchConvexCodegen} the moment codegen lands.
 */
function registerConvexTypeFallback(nuxt: Nuxt): void {
  const functionsDir = resolveFunctionsDir(nuxt.options.rootDir)
  addTypeTemplate({
    filename: 'types/nuxt-convex-module-api-fallback.d.ts',
    getContents: () => convexTypeFallbackContents(hasGeneratedApi(nuxt.options.rootDir, functionsDir), functionsDir),
  }, { nuxt: true, nitro: true })
}

/** Templates that must re-render when `convex dev` emits `_generated/api`. */
const CODEGEN_GUARDED_TEMPLATES = ['nuxt-convex-module-provide-api.mjs', 'types/nuxt-convex-module-api-fallback.d.ts']

/**
 * In dev, re-render the codegen-guarded templates the instant `convex dev`
 * emits `_generated/api`, so the generated `api` is wired app-wide (and the
 * placeholder types retire) without a dev-server restart — the fs-guarded
 * templates otherwise only re-evaluate on a full rebuild. Uses Nuxt's existing
 * file watcher via the `builder:watch` hook — no watcher of our own to tear
 * down.
 */
function watchConvexCodegen(nuxt: Nuxt): void {
  if (!nuxt.options.dev) return
  nuxt.hook('builder:watch', async (_event, path) => {
    if (!path.replace(/\\/g, '/').includes('_generated/api')) return
    await updateTemplates({ filter: template => CODEGEN_GUARDED_TEMPLATES.includes(template.filename) })
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
    { name: 'provideConvexApi', from: resolver.resolve('./runtime/vue/provide') },
    { name: 'useConvexApi', from: resolver.resolve('./runtime/vue/provide') },
    { name: 'useConvexNamespace', from: resolver.resolve('./runtime/vue/provide') },
    { name: 'usePreloadedQuery', from: resolver.resolve('./runtime/vue/hydration') },
    // Nuxt-only (imports `#app`), hence under runtime/nuxt/ — see PARITY.md.
    { name: 'useAsyncQuery', from: resolver.resolve('./runtime/nuxt/composables/use-async-query') },
    { name: 'useConvexAsyncQuery', from: resolver.resolve('./runtime/nuxt/composables/use-async-query') },
    { name: 'usePaginatedQuery', from: resolver.resolve('./runtime/vue/composables/use-paginated-query') },
    { name: 'useConvexPaginatedQuery', from: resolver.resolve('./runtime/vue/composables/use-paginated-query') },
    { name: 'usePaginatedQuery_experimental', from: resolver.resolve('./runtime/vue/composables/use-paginated-query') },
  ]
  addImports(composables)
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
 * `useAuth` / `usePreloadedAuthQuery` composables, and the `convexAuth(event)`
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
  // The proxy forwards live session/token traffic — never cache it, and keep it
  // out of any prerender pass.
  extendRouteRules(`${authRoute}/**`, { cache: false, prerender: false })
  addRouteMiddleware({
    name: 'auth',
    path: resolver.resolve('./runtime/better-auth/nuxt/middleware'),
    global: false,
  })

  addServerImports([
    { name: 'convexAuth', from: resolver.resolve('./runtime/better-auth/nuxt/server') },
    { name: 'convexBetterAuthNuxt', from: resolver.resolve('./runtime/better-auth/nuxt/server') },
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
 * CSP `connect-src` entries the browser needs to reach a Convex deployment: the
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
 * Apply nuxt-convex-module's secure-by-default, Convex-aware CSP onto a security config
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
 * was unset) and `additions`, deduplicated and order-preserving. With no
 * additions the directive is left entirely untouched — materializing the
 * baseline alone would *create* a restriction where nuxt-security's defaults
 * leave the directive open (how `connect-src` stays HMR-safe in dev).
 */
function tightenDirective(csp: Record<string, unknown>, name: string, baseline: string[], additions: string[]): void {
  if (additions.length === 0) return
  const existing = Array.isArray(csp[name]) ? csp[name] as string[] : baseline
  csp[name] = uniq([...existing, ...additions])
}
