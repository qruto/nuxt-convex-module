// PARITY: D-18
import { describe, expect, it } from 'vitest'
import noSessionVaryPlugin, { withCookieVary, type NoSessionResponseEvent } from '../../../../src/runtime/better-auth/nuxt/no-session-vary'
import { NO_SESSION_CONTEXT_KEY } from '../../../../src/runtime/better-auth/nuxt/shared-render'

// The payload is written once the page renders; a `render:response` hook can
// still make the response cacheable after that. A response whose payload says
// there is no session then varies on `Cookie`, so a shared cache never hands
// it to a visitor whose request carries a session cookie.

function respond(context: Record<string, unknown>, headers: Record<string, string>) {
  let hook: ((event: NoSessionResponseEvent) => void) | undefined
  noSessionVaryPlugin({ hooks: { hook: (_name, fn) => hook = fn } })
  const sent = { ...headers }
  hook!({
    context,
    node: { res: { getHeader: name => sent[name], setHeader: (name, value) => sent[name] = value } },
  })
  return sent
}

describe('a no-session response made cacheable after it rendered', () => {
  it('varies on Cookie when a late header lets a shared cache keep it', () => {
    const sent = respond({ [NO_SESSION_CONTEXT_KEY]: true }, { 'cache-control': 'public, s-maxage=600', 'vary': 'Accept-Encoding' })
    expect(sent.vary).toBe('Accept-Encoding, Cookie')
  })

  it('leaves a private response, or one without the flag, alone', () => {
    expect(respond({ [NO_SESSION_CONTEXT_KEY]: true }, { 'cache-control': 'private, no-store' }).vary).toBeUndefined()
    expect(respond({ [NO_SESSION_CONTEXT_KEY]: false }, { 'cache-control': 'public, max-age=60' }).vary).toBeUndefined()
    expect(respond({}, { 'cdn-cache-control': 'max-age=60' }).vary).toBeUndefined()
  })

  it('writes Nitro 3\'s web headers too', () => {
    const headers = new Headers({ 'surrogate-control': 'max-age=600' })
    let hook: ((event: NoSessionResponseEvent) => void) | undefined
    noSessionVaryPlugin({ hooks: { hook: (_name, fn) => hook = fn } })
    hook!({ context: { [NO_SESSION_CONTEXT_KEY]: true }, res: { headers } })
    expect(headers.get('vary')).toBe('Cookie')
  })

  it('keeps what Vary named, and never adds Cookie twice', () => {
    expect(withCookieVary(undefined)).toBe('Cookie')
    expect(withCookieVary('Accept, cookie')).toBe('Accept, cookie')
    expect(withCookieVary('*')).toBe('*')
    expect(withCookieVary(['Accept', 'Origin'])).toBe('Accept, Origin, Cookie')
  })
})
