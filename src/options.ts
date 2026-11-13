// Build-time helpers behind the module's setup: option validation, integration
// state, the dev startup summary. Kept out of `module.ts` so they stay off the
// package's `.` entry — nuxt-module-build re-exports everything that file
// exports, and none of this is API. Tests import this file directly.
import { basename, dirname, isAbsolute, join, sep } from 'node:path'
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseEnv } from 'node:util'

/**
 * Which opt-in integrations ended up enabled — returned by
 * the module's `registerIntegrations` for the dev startup summary (and the DevTools
 * panel, which reports the active adapter).
 */
export interface IntegrationFlags {
  betterAuth: boolean
  clerk: boolean
  auth0: boolean
  polar: boolean
  /** nuxt-security registered and its CSP extended with the Convex origins. */
  security: boolean
}

/**
 * Decide whether an opt-in integration is enabled, distinguishing the
 * misconfiguration case: explicitly enabled but the backing package is not
 * installed (`missingPackage`), where silently registering the runtime would
 * surface as an opaque Vite import error instead of an actionable message.
 *
 * Auto-detection (option unset) needs the package both resolvable *and*
 * declared by the app's own `package.json`. Resolution alone walks every
 * ancestor `node_modules`, so in a monorepo a sibling app's Better Auth or
 * nuxt-security would switch the integration on here — mounting an auth proxy
 * the app has no configuration for. An explicit `true` keeps working on
 * resolution alone, for a package a layer or the workspace root provides.
 */
export function resolveIntegrationState(
  explicit: boolean | object | undefined,
  installed: boolean,
  declared: boolean = installed,
): { enabled: boolean, missingPackage: boolean } {
  if (explicit === false) return { enabled: false, missingPackage: false }
  if (explicit === undefined) return { enabled: installed && declared, missingPackage: false }
  return installed
    ? { enabled: true, missingPackage: false }
    : { enabled: false, missingPackage: true }
}

/**
 * Whether the app's own `package.json` names the package in any dependency
 * field. This is the "did the user ask for it" signal that auto-detection
 * needs and resolution cannot give.
 */
export function isDeclaredDependency(id: string, rootDir: string): boolean {
  return declaredDependencies(rootDir).includes(id)
}

/** Every package the app's own `package.json` names, across its dependency fields. */
function declaredDependencies(rootDir: string): string[] {
  try {
    const manifest = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')) as Record<string, unknown>
    return ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].flatMap((field) => {
      const names = manifest[field]
      return typeof names === 'object' && names !== null ? Object.keys(names) : []
    })
  }
  catch {
    return []
  }
}

/** Result of {@link validateModuleOptions}: findings plus normalized values. */
export interface ModuleOptionDiagnostics {
  errors: string[]
  warnings: string[]
  /** `authRoute` with a leading slash ensured and any trailing slash stripped. */
  authRoute: string
  /** `betterAuth.loginPath`, normalised the same way. */
  loginPath: string
}

/**
 * Drop every trailing `/`. Scanned character by character rather than with
 * `/\/+$/`: that pattern is unanchored at the start, so the engine retries from
 * every position and the cost is quadratic in the length of the slash run —
 * 6.5s on a 60,000-slash input against 0.04ms here (CodeQL js/polynomial-redos).
 */
export function stripTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end--
  return value.slice(0, end)
}

/**
 * Ensure a leading slash — with a warning, since the value was most likely a
 * typo — and drop trailing ones silently: the proxy route and the `auth`
 * middleware compare paths exactly, so `login/` would never match `/login`.
 */
function normalizeRoutePath(value: string, option: string, warnings: string[]): string {
  let path = value
  if (!path.startsWith('/')) {
    path = `/${path}`
    warnings.push(`\`${option}\` ("${value}") must start with "/" — using "${path}".`)
  }
  return path.length > 1 && path.endsWith('/') ? stripTrailingSlashes(path) : path
}

/**
 * Validate the resolved module configuration, turning silent misconfiguration
 * (swapped `.convex.cloud`/`.convex.site` URLs, malformed URLs, an `authRoute`
 * that would produce a broken server-handler route or that the bundled auth
 * client cannot follow, a `loginPath` the middleware's self-redirect guard
 * could never match, a `betterAuth.authClient` path that doesn't exist) into
 * actionable messages. Pure — the caller logs the findings and applies the
 * normalized `authRoute` and `loginPath`.
 */
export function validateModuleOptions(input: {
  url: string
  siteUrl: string
  authRoute: string
  loginPath?: string
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
    errors.push(
      `\`convex.siteUrl\` ("${input.siteUrl}") ends with .convex.cloud, which is the deployment domain — site URLs (HTTP Actions) end with .convex.site. Did you swap it with \`convex.url\`?`,
    )
  }
  else if (input.siteUrl && !isHttpUrl(input.siteUrl)) {
    warnings.push(
      `\`convex.siteUrl\` ("${input.siteUrl}") does not look like a valid http(s) URL.`,
    )
  }

  const authRoute = normalizeRoutePath(input.authRoute, 'convex.betterAuth.authRoute', warnings)
  const loginPath = normalizeRoutePath(input.loginPath ?? '/login', 'convex.betterAuth.loginPath', warnings)
  // The bundled Better Auth client is created with Better Auth's default
  // `basePath`, `/api/auth`. Moving the proxy without moving the client leaves
  // every auth call hitting a route that no longer exists — silently, as 404s.
  if (authRoute !== '/api/auth' && !input.authClient) {
    errors.push(
      `\`convex.betterAuth.authRoute\` is "${authRoute}" but the bundled Better Auth client still calls /api/auth, so every auth request would 404. Keep the default route, or set \`convex.betterAuth.authClient\` to a client created with \`basePath: "${authRoute}"\`.`,
    )
  }

  if (input.authClient && !authClientModuleExists(input.authClient, input.rootDir)) {
    errors.push(
      `\`convex.betterAuth.authClient\` points at "${input.authClient}", which does not exist (resolved against \`${input.rootDir}\`). The build would fail with an opaque import error — fix the path or remove the option to use the bundled client.`,
    )
  }

  return { errors, warnings, authRoute, loginPath }
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
 * omit one. A candidate has to be a file: a bare directory exists too, but
 * only its `index.*` (probed separately) is importable.
 */
function authClientModuleExists(authClient: string, rootDir: string): boolean {
  const base = isAbsolute(authClient) ? authClient : join(rootDir, authClient)
  return ['', '.ts', '.js', '.mts', '.mjs', '/index.ts', '/index.js'].some((suffix) => {
    const candidate = `${base}${suffix}`
    return existsSync(candidate) && statSync(candidate).isFile()
  })
}

/**
 * Warnings about how the enabled integrations combine, or what they still
 * need. Pure: the caller logs each line.
 *
 * - Better Auth's plugins own the Convex client's auth. With Clerk or Auth0 on
 *   as well, `provideConvexAuthFromClerk()` / `...FromAuth0()` would call
 *   `setAuth` on the same client and the two fight over it.
 * - `<CheckoutLink>` imports `@polar-sh/checkout`, a peer of `@convex-dev/polar`
 *   that yarn and `--legacy-peer-deps` installs skip. Vite fails the client
 *   build the first time the component is used — say so at startup instead.
 */
export function integrationWarnings(
  flags: IntegrationFlags,
  isInstalled: (pkg: string) => boolean,
): string[] {
  const warnings: string[] = []
  const rivals = [flags.clerk && 'Clerk', flags.auth0 && 'Auth0'].filter((name): name is string => Boolean(name))
  if (flags.betterAuth && rivals.length > 0) {
    const options = rivals.map(name => `\`convex.${name.toLowerCase()}: false\``).join(' / ')
    warnings.push(
      `Better Auth and ${rivals.join(' and ')} are both enabled. Better Auth's plugin owns the Convex client's auth, so the ${rivals.join(' / ')} adapter would fight it — set ${options}, or \`convex.betterAuth: false\`, to pick one.`,
    )
  }
  if (flags.polar && !isInstalled('@polar-sh/checkout')) {
    warnings.push(
      '`@convex-dev/polar` is installed but its peer `@polar-sh/checkout` is not — `<CheckoutLink>` imports it and the build fails the moment the component is used. Run `npm install @polar-sh/checkout@~0.6.0`.',
    )
  }
  return warnings
}

/**
 * The packages the client runtime imports, for Vite to pre-bundle in dev.
 * Vite does not crawl the runtime, so it finds these on the first page load
 * and reloads the page once. Only the enabled integrations' entries are
 * listed, each under the name `locate` gives it (see
 * {@link createDependencyLocator}). An entry `locate` cannot place is left
 * out: an optional peer such as `@polar-sh/checkout` may be missing, and an
 * entry Vite cannot resolve makes Nuxt print NUXT_B7002.
 */
export function clientDependencies(
  flags: IntegrationFlags,
  locate: (pkg: string) => string | undefined,
): string[] {
  const entries = [
    'convex/browser',
    'convex/server',
    'convex/values',
    ...(flags.betterAuth ? ['@convex-dev/better-auth/client/plugins', 'better-auth/vue'] : []),
    ...(flags.clerk ? ['@clerk/vue'] : []),
    ...(flags.auth0 ? ['@auth0/auth0-vue'] : []),
    ...(flags.polar ? ['@polar-sh/checkout/embed'] : []),
  ]
  return entries.flatMap((entry) => {
    const prefix = locate(entry.split('/').slice(0, entry.startsWith('@') ? 2 : 1).join('/'))
    return prefix === undefined ? [] : [`${prefix}${entry}`]
  })
}

/**
 * How Vite reaches a package from the app's root, as the prefix its
 * `optimizeDeps.include` entry needs: `''` when the package is in a
 * `node_modules` folder above the root, `'nuxt-convex-module > '` (or
 * `'<dependency> > nuxt-convex-module > '`) when only this module's own folder
 * has it, and `undefined` when neither does.
 *
 * Vite resolves an include entry from the root, not from the file that
 * imports it. npm, yarn and a hoisted pnpm put every peer this module imports
 * up there. pnpm's default isolated layout does not: a peer the app never
 * listed itself (better-auth under a wrapper module such as nuxt-backend, or
 * one pnpm installed for the peer range alone) lands only beside this module
 * in the virtual store. Vite's nested form walks there one package name at a
 * time, `nuxt-convex-module > better-auth/vue`, pre-bundles the copy this
 * module's runtime imports, and matches that import to it by its folder.
 *
 * The walk is looked for among the app's own dependencies, one deep: this
 * module, or a package that depends on it. A longer chain leaves the entry
 * out, and Vite finds the import on the first page load, as it would with no
 * list at all.
 */
export function createDependencyLocator(
  rootDir: string,
  moduleDir = dirname(fileURLToPath(import.meta.url)),
): (pkg: string) => string | undefined {
  let walk: ModuleWalk | false | undefined
  return (pkg) => {
    if (findPackageDir(pkg, rootDir) !== undefined) return ''
    walk ??= walkToModule(rootDir, moduleDir) ?? false
    return walk && findPackageDir(pkg, walk.dir) !== undefined ? `${walk.names.join(' > ')} > ` : undefined
  }
}

/** The package names Vite walks from the app's root to this module, and the folder they lead to. */
interface ModuleWalk {
  names: string[]
  dir: string
}

const MODULE_NAME = 'nuxt-convex-module'

/**
 * Find the walk {@link createDependencyLocator} names: this module as one of
 * the app's dependencies, or one of those dependencies first. Each step is
 * checked against the folder this module really runs from, so a second copy
 * of it elsewhere in the tree is not mistaken for this one.
 *
 * A dependency counts as the first step only when its own `package.json`
 * names this module. pnpm also links every package into
 * `node_modules/.pnpm/node_modules`, which any package in the store reaches
 * by walking up, so `nuxt > nuxt-convex-module` would resolve too: it would
 * just name the wrong parent and lean on that hoisting.
 */
function walkToModule(rootDir: string, moduleDir: string): ModuleWalk | undefined {
  const own = realpathSync(moduleDir)
  const isOwn = (dir: string | undefined): dir is string => dir !== undefined && (own === dir || own.startsWith(dir + sep))
  const direct = findPackageDir(MODULE_NAME, rootDir)
  if (isOwn(direct)) return { names: [MODULE_NAME], dir: direct }
  for (const dependency of declaredDependencies(rootDir)) {
    const parent = findPackageDir(dependency, rootDir)
    if (parent === undefined || !isDeclaredDependency(MODULE_NAME, parent)) continue
    const nested = findPackageDir(MODULE_NAME, parent)
    if (isOwn(nested)) return { names: [dependency, MODULE_NAME], dir: nested }
  }
  return undefined
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
    security: 'nuxt-security',
  }
  const enabled = (Object.keys(names) as Array<keyof IntegrationFlags>)
    .filter(key => integrations[key])
    .map(key => names[key])
  return `Convex ${url || '(no URL)'} · functions: ${functionsDir}/ · integrations: ${enabled.join(', ') || 'none'}`
}

/**
 * Whether a package is installed for the consumer app (or, as a fallback, for
 * this module) — used to auto-enable the optional integrations (Better Auth,
 * Polar, nuxt-security, ...) without making the user list extra modules.
 *
 * Probes for the package directory in every `node_modules` folder a bare
 * import would search, rather than resolving the package: resolution honours
 * its `exports` map, so an ESM-only package that withholds `./package.json`
 * (nuxt-security), or one with no `.` export (@polar-sh/checkout), would
 * report as missing even though it is right there.
 */
export function isPackageInstalled(id: string, rootDir: string): boolean {
  return [rootDir, dirname(fileURLToPath(import.meta.url))].some(base => findPackageDir(id, base) !== undefined)
}

/**
 * The folder a bare import of `id` from `dir` finds the package in, probed
 * the way {@link isPackageInstalled} explains, or `undefined`. The real path:
 * Vite follows the symlinks pnpm installs through before it resolves the next
 * step of a nested entry, so the walk has to as well.
 */
function findPackageDir(id: string, dir: string): string | undefined {
  for (const folder of nodeModulesPaths(dir)) {
    const candidate = join(folder, id)
    if (existsSync(join(candidate, 'package.json'))) return realpathSync(candidate)
  }
  return undefined
}

/**
 * The `node_modules` folders Node searches for a bare import from `dir`,
 * nearest first. Node's global folders (`NODE_PATH`, `~/.node_modules`) are
 * left out: Vite and ESM imports never look there.
 */
function nodeModulesPaths(dir: string): string[] {
  const paths: string[] = []
  for (let current = dir; ; current = dirname(current)) {
    if (basename(current) !== 'node_modules') paths.push(join(current, 'node_modules'))
    if (dirname(current) === current) return paths
  }
}

/**
 * Resolve the deployment and site URLs from module options, then environment.
 *
 * The `NUXT_PUBLIC_*` names come first: they are the Nuxt-shaped ones, and the
 * only ones Nitro will also apply as a runtime override on a built app. The
 * unprefixed names are read after them because that is what `npx convex dev`
 * writes — the Convex CLI picks its variable name per framework and has no Nuxt
 * case, so it falls back to `CONVEX_URL`. Reading both means someone who has
 * only ever run the CLI needs no `convex.url` in `nuxt.config` at all.
 */
export function resolveDeploymentUrls(
  options: { url?: string, siteUrl?: string },
  env: Record<string, string | undefined>,
): { url: string, siteUrl: string } {
  // Trailing slashes are stripped here, on every source at once: the swap
  // checks in `validateModuleOptions` key on the suffix, and upstream's client
  // builds `wss://host//api/...` from a URL that keeps one.
  return {
    url: stripTrailingSlashes(options.url || env.NUXT_PUBLIC_CONVEX_URL || env.CONVEX_URL || ''),
    siteUrl: stripTrailingSlashes(options.siteUrl || env.NUXT_PUBLIC_CONVEX_SITE_URL || env.CONVEX_SITE_URL || ''),
  }
}

/**
 * The development warning for an app that calls another deployment than the
 * one `npx convex dev` pushes its functions to. The CLI writes that deployment
 * as `CONVEX_URL`, but `convex.url` and `NUXT_PUBLIC_CONVEX_URL` win over it,
 * so a value left from another project or deployment points the app elsewhere.
 * Every new or changed function then fails as not found, and neither the CLI
 * nor Nuxt says why.
 */
export function deploymentWarnings(
  options: { url?: string },
  env: Record<string, string | undefined>,
): string[] {
  const warnings: string[] = []
  const cliUrl = stripTrailingSlashes(env.CONVEX_URL || '')
  const source = options.url ? '`convex.url`' : env.NUXT_PUBLIC_CONVEX_URL ? 'NUXT_PUBLIC_CONVEX_URL' : ''
  const { url } = resolveDeploymentUrls(options, env)
  if (cliUrl && source && url !== cliUrl) {
    // Every override naming another deployment: removing only the one that
    // won would hand the app to the next.
    const stale = ([['`convex.url`', options.url], ['NUXT_PUBLIC_CONVEX_URL', env.NUXT_PUBLIC_CONVEX_URL]] as const)
      .filter(([, value]) => value && stripTrailingSlashes(value) !== cliUrl)
      .map(([name]) => name)
    warnings.push(
      `The app calls ${url} (from ${source}), but \`npx convex dev\` pushes your functions to ${cliUrl} (CONVEX_URL). New or changed functions will fail with "Could not find public function". Remove ${stale.join(' and ')} to follow \`convex dev\`, or point ${source} at ${cliUrl}.`,
    )
  }
  return warnings
}

/**
 * The environment {@link resolveDeploymentUrls} reads: `env` itself, and in
 * development the app's `.env.local` beneath it, so a variable already set
 * wins. `npx convex dev` writes the deployment URL to `.env.local`, and Nuxt
 * loads only `.env`. Vite and Next read `.env.local` on their own, which is how
 * Convex's templates for them find the URL; this is that step for Nuxt.
 *
 * It matters most on the first `convex dev --start "nuxt dev"`: the CLI passes
 * Nuxt the environment it loaded from `.env.local` at startup, and on that
 * first run the file did not exist yet. The CLI has written it by the time it
 * starts Nuxt. A build reads only `env`, so the URL it bakes in is never one
 * left over from local development.
 */
export function deploymentEnv(
  rootDir: string,
  env: Record<string, string | undefined>,
  dev: boolean,
): Record<string, string | undefined> {
  if (!dev) return env
  let local: Record<string, string | undefined>
  try {
    local = parseEnv(readFileSync(join(rootDir, '.env.local'), 'utf8'))
  }
  catch {
    return env
  }
  return { ...local, ...env }
}
