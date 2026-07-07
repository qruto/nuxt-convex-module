import { describe, expect, it } from 'vitest'
import { applyConvexSecurityDefaults, convexConnectSrc, convexResourceSrc } from '../../src/module'

const URL = 'https://happy-otter-123.convex.cloud'
const SITE_URL = 'https://happy-otter-123.convex.site'

describe('convexConnectSrc', () => {
  it('allows the deployment over HTTPS and WebSocket, plus the site URL', () => {
    expect(convexConnectSrc(URL, SITE_URL)).toEqual([
      'https://happy-otter-123.convex.cloud',
      'wss://happy-otter-123.convex.cloud',
      'https://happy-otter-123.convex.site',
      'wss://happy-otter-123.convex.site',
    ])
  })

  it('maps a local http deployment to ws, deduplicated', () => {
    expect(convexConnectSrc('http://127.0.0.1:3210')).toEqual([
      'http://127.0.0.1:3210',
      'ws://127.0.0.1:3210',
    ])
  })

  it('returns [] for missing or unparseable input', () => {
    expect(convexConnectSrc()).toEqual([])
    expect(convexConnectSrc('not a url')).toEqual([])
  })
})

describe('convexResourceSrc', () => {
  it('allows the deployment origin only', () => {
    expect(convexResourceSrc(URL)).toEqual(['https://happy-otter-123.convex.cloud'])
  })

  it('returns [] for missing input', () => {
    expect(convexResourceSrc()).toEqual([])
  })
})

describe('applyConvexSecurityDefaults', () => {
  const connectSrc = convexConnectSrc(URL, SITE_URL)
  const resourceSrc = convexResourceSrc(URL)

  it('tightens unset directives to baseline plus the Convex origins', () => {
    const security: Record<string, unknown> = {}
    applyConvexSecurityDefaults(security, connectSrc, resourceSrc)

    const csp = (security.headers as Record<string, unknown>).contentSecurityPolicy as Record<string, unknown>
    expect(csp['connect-src']).toEqual(['\'self\'', ...connectSrc])
    expect(csp['img-src']).toEqual(['\'self\'', 'data:', ...resourceSrc])
    expect(csp['media-src']).toEqual(['\'self\'', ...resourceSrc])
  })

  it('appends to user-set directives instead of replacing them', () => {
    const security: Record<string, unknown> = {
      headers: {
        contentSecurityPolicy: {
          'img-src': ['\'self\'', 'https://cdn.example.com'],
        },
      },
    }
    applyConvexSecurityDefaults(security, connectSrc, resourceSrc)

    const csp = (security.headers as Record<string, unknown>).contentSecurityPolicy as Record<string, unknown>
    expect(csp['img-src']).toEqual(['\'self\'', 'https://cdn.example.com', ...resourceSrc])
  })

  it('leaves a directive entirely untouched when there is nothing to add', () => {
    // The dev path: connect-src additions are withheld so the directive is not
    // materialized — creating `connect-src 'self'` would block the Vite HMR /
    // devtools WebSockets, which run on ports `'self'` does not cover.
    const security: Record<string, unknown> = {}
    applyConvexSecurityDefaults(security, [], resourceSrc)

    const csp = (security.headers as Record<string, unknown>).contentSecurityPolicy as Record<string, unknown>
    expect(csp['connect-src']).toBeUndefined()
    expect(csp['img-src']).toEqual(['\'self\'', 'data:', ...resourceSrc])
    expect(csp['media-src']).toEqual(['\'self\'', ...resourceSrc])
  })

  it('respects headers: false and contentSecurityPolicy: false opt-outs', () => {
    const headersOff: Record<string, unknown> = { headers: false }
    applyConvexSecurityDefaults(headersOff, connectSrc, resourceSrc)
    expect(headersOff.headers).toBe(false)

    const cspOff: Record<string, unknown> = { headers: { contentSecurityPolicy: false } }
    applyConvexSecurityDefaults(cspOff, connectSrc, resourceSrc)
    expect((cspOff.headers as Record<string, unknown>).contentSecurityPolicy).toBe(false)
  })
})
