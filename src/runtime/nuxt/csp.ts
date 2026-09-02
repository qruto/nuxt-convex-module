/**
 * Pure helpers behind the Convex-aware Content Security Policy the module
 * applies when `nuxt-security` is present — shared by the Nitro plugin
 * (`./security`) and the unit tests. Import-free so it runs anywhere.
 */

/**
 * The slice of a nuxt-security rule set this module touches: the resolved
 * options for one route (`rules['/**']` at runtime), where `headers` and
 * `contentSecurityPolicy` may each be `false` when the app switched them off.
 */
export interface SecurityRules {
  headers?: false | {
    contentSecurityPolicy?: false | Record<string, unknown>
    [header: string]: unknown
  }
  [option: string]: unknown
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
 * CSP sources for Convex-served resources (`img-src` / `media-src`): files
 * uploaded through `useStorageUrl()` are served from the deployment origin,
 * and files streamed by HTTP actions from the `.site` origin.
 */
export function convexResourceSrc(url?: string, siteUrl?: string): string[] {
  return uniq([toHttpOrigin(url), toHttpOrigin(siteUrl)])
}

/**
 * Apply nuxt-convex-module's secure-by-default, Convex-aware CSP onto a
 * nuxt-security rule set (mutated in place). This tightens the directives we
 * can safely pre-fill — locking network egress and Convex-served media to
 * same-origin plus the Convex deployment — while leaving every other directive
 * (script/style/font, etc.) to nuxt-security's own defaults.
 *
 * For each directive we keep any value the user already set and *append* the
 * Convex origins, so consumers extend (add their own third parties) rather than
 * fight the defaults, and the Convex origins are always present. A user who sets
 * `contentSecurityPolicy: false` (CSP disabled) is left untouched, as is a rule
 * set with nothing to add (no Convex URL).
 */
export function applyConvexSecurityDefaults(
  rules: SecurityRules,
  connectSrc: string[],
  resourceSrc: string[],
): void {
  if (connectSrc.length === 0 && resourceSrc.length === 0) return
  if (rules.headers === false) return
  if (typeof rules.headers !== 'object' || rules.headers === null) rules.headers = {}
  const headers = rules.headers

  if (headers.contentSecurityPolicy === false) return // CSP explicitly disabled.
  if (typeof headers.contentSecurityPolicy !== 'object' || headers.contentSecurityPolicy === null) {
    headers.contentSecurityPolicy = {}
  }
  const csp = headers.contentSecurityPolicy

  tightenDirective(csp, 'connect-src', ['\'self\''], connectSrc)
  tightenDirective(csp, 'img-src', ['\'self\'', 'data:'], resourceSrc)
  tightenDirective(csp, 'media-src', ['\'self\''], resourceSrc)
}

/**
 * Set a CSP directive to the union of its existing value (or `baseline` if it
 * was unset) and `additions`, deduplicated and order-preserving. nuxt-security
 * accepts a directive as an array or a space-separated string; both are read.
 * With no additions the directive is left entirely untouched — materializing
 * the baseline alone would *create* a restriction where nuxt-security's
 * defaults leave the directive open (how `connect-src` stays HMR-safe in dev).
 */
function tightenDirective(csp: Record<string, unknown>, name: string, baseline: string[], additions: string[]): void {
  if (additions.length === 0) return
  const current = csp[name]
  const existing = Array.isArray(current)
    ? current as string[]
    : typeof current === 'string'
      ? current.split(/\s+/).filter(Boolean)
      : baseline
  csp[name] = uniq([...existing, ...additions])
}
