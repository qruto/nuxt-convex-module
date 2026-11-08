// PARITY: D-18
import { CACHING_HEADERS, isSharedRender, NO_SESSION_CONTEXT_KEY } from './shared-render'

/**
 * The slice of a response event this plugin reads and writes: Nitro 2's node
 * response, or Nitro 3's web headers. Typed locally, so the published types
 * don't depend on how the app resolves `nitropack`.
 */
export interface NoSessionResponseEvent {
  context: Record<string, unknown>
  node?: { res?: { getHeader?: (name: string) => unknown, setHeader?: (name: string, value: string) => unknown } }
  res?: { headers?: { get: (name: string) => string | null, set: (name: string, value: string) => void } }
}

/** The Nitro app hook this plugin listens on. */
export interface NoSessionNitroApp {
  hooks: { hook: (name: 'beforeResponse', fn: (event: NoSessionResponseEvent) => void) => unknown }
}

function readHeader(event: NoSessionResponseEvent, name: string): unknown {
  return event.node?.res?.getHeader?.(name) ?? event.res?.headers?.get(name) ?? undefined
}

function writeHeader(event: NoSessionResponseEvent, name: string, value: string): void {
  if (event.node?.res?.setHeader) event.node.res.setHeader(name, value)
  else event.res?.headers?.set(name, value)
}

/** `vary` with `Cookie` in it, keeping what it named already. */
export function withCookieVary(vary: unknown): string {
  const names = (Array.isArray(vary) ? vary.join(',') : typeof vary === 'string' ? vary : '').split(',').map(name => name.trim()).filter(Boolean)
  if (names.includes('*') || names.some(name => name.toLowerCase() === 'cookie')) return names.join(', ')
  return [...names, 'Cookie'].join(', ')
}

/**
 * Nitro plugin: a response whose payload says the server saw no session, made
 * cacheable after the page rendered (a `render:response` hook, a header set
 * once the payload was written), varies on `Cookie`. The payload can no
 * longer change by then; varying keeps a shared cache from handing that
 * cookie-less render to a visitor whose request carries a session cookie.
 * Runs on `beforeResponse`, after every `render:response` hook and the
 * headers they set.
 */
export default function noSessionVaryPlugin(nitroApp: NoSessionNitroApp): void {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (event.context[NO_SESSION_CONTEXT_KEY] !== true) return
    const headers = Object.fromEntries(CACHING_HEADERS.map(name => [name, readHeader(event, name)]))
    if (!isSharedRender({ headers })) return
    writeHeader(event, 'vary', withCookieVary(readHeader(event, 'vary')))
  })
}
