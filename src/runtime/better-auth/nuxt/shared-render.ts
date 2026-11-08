// PARITY: D-18
// Whether a render may be served to visitors other than the one it was made
// for. Free of `#app` and Nitro imports: the Better Auth server plugin and the
// Nitro response hook both read it.

/** Set on a request whose payload says the server saw no session (`event.context`). @internal */
export const NO_SESSION_CONTEXT_KEY = 'convexNoSession'

/** The parts of a request event `isSharedRender` reads. */
export interface RenderContext {
  /** Nitro's matched route rules (`event.context._nitro.routeRules`), `swr`/`isr` normalised into `cache`. */
  routeRules?: Record<string, unknown>
  /** Set by Nitro's cached handler on the render it caches (`event.context.cache`). */
  cache?: unknown
  /** The response's caching headers as the render sees them, by lower-case name. */
  headers?: Record<string, unknown>
}

/** The headers that let a cache keep a response. @internal */
export const CACHING_HEADERS = ['cache-control', 'cdn-cache-control', 'surrogate-control'] as const

/** A header's value as one string; `''` when unset. */
function headerText(value: unknown): string {
  if (Array.isArray(value)) return value.join(',')
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

/** Whether a caching header lets a cache other than this browser's keep the response. */
function storesForOthers(name: (typeof CACHING_HEADERS)[number], value: string): boolean {
  const directives = value.toLowerCase().split(',').map(directive => directive.trim().split('=')[0]!).filter(Boolean)
  if (directives.length === 0 || directives.includes('private') || directives.includes('no-store')) return false
  // CDN-Cache-Control and Surrogate-Control speak only to shared caches.
  if (name !== 'cache-control') return true
  return directives.includes('public') || directives.includes('s-maxage') || directives.includes('max-age')
}

/**
 * Whether this render may be served to other visitors: Nitro caches it (its
 * cached handler marks the render, or a `cache`/`swr`/`isr`/`prerender`
 * rule matches), or a caching header lets a shared cache keep it. Nitro's
 * cached handler renders with no cookie (only the `varies` headers reach
 * it), so a cached render always looks signed out: its payload must not tell
 * every browser that reads it there is no session. Read off Nitro's own
 * rules, not `getRouteRules()` from `#app`, which folds the caching rules
 * into `payload`.
 *
 * @internal
 */
export function isSharedRender({ routeRules = {}, cache, headers = {} }: RenderContext): boolean {
  // `payload`: what Nuxt folds `cache`/`swr`/`isr` into, should a merged rule set carry it.
  if (cache || routeRules.cache || routeRules.swr || routeRules.isr || routeRules.prerender || routeRules.payload) return true
  const ruleHeaders = Object.fromEntries(Object.entries((routeRules.headers ?? {}) as Record<string, unknown>).map(([name, value]) => [name.toLowerCase(), value]))
  return CACHING_HEADERS.some(name => storesForOthers(name, headerText(headers[name])) || storesForOthers(name, headerText(ruleHeaders[name])))
}
