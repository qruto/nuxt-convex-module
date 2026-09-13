// Build-time helpers behind the module's setup: option validation, integration
// state, the dev startup summary. Kept out of `module.ts` so they stay off the
// package's `.` entry — nuxt-module-build re-exports everything that file
// exports, and none of this is API. Tests import this file directly.
import { isAbsolute, join } from 'node:path'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

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
 * Drop every trailing `/`. Scanned character by character rather than with
 * `/\/+$/`: that pattern is unanchored at the start, so the engine retries from
 * every position and the cost is quadratic in the length of the slash run —
 * 6.5s on a 60,000-slash input against 0.04ms here (CodeQL js/polynomial-redos).
 */
function stripTrailingSlashes(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === '/') end--
  return value.slice(0, end)
}

/**
 * Validate the resolved module configuration, turning silent misconfiguration
 * (swapped `.convex.cloud`/`.convex.site` URLs, malformed URLs, an `authRoute`
 * that would produce a broken server-handler route, a `betterAuth.authClient`
 * path that doesn't exist) into actionable messages. Pure — the caller logs
 * the findings and applies the normalized `authRoute`.
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
    authRoute = stripTrailingSlashes(authRoute)
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
 * Probes the package directory along Node's lookup paths rather than calling
 * `require.resolve`: that honours the package's `exports` map under CJS
 * conditions, so an ESM-only package that also withholds `./package.json`
 * (nuxt-security) reports as missing even though it is right there.
 */
export function isPackageInstalled(id: string, rootDir: string): boolean {
  for (const base of [join(rootDir, 'package.json'), import.meta.url]) {
    const lookupPaths = createRequire(base).resolve.paths(id) ?? []
    if (lookupPaths.some(dir => existsSync(join(dir, id, 'package.json')))) return true
  }
  return false
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
 *
 *
 */
export function resolveDeploymentUrls(
  options: { url?: string, siteUrl?: string },
  env: Record<string, string | undefined>,
): { url: string, siteUrl: string } {
  return {
    url: options.url || env.NUXT_PUBLIC_CONVEX_URL || env.CONVEX_URL || '',
    siteUrl: options.siteUrl || env.NUXT_PUBLIC_CONVEX_SITE_URL || env.CONVEX_SITE_URL || '',
  }
}
