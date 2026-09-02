import { describe, expect, it } from 'vitest'
import { applyConvexSecurityDefaults, convexConnectSrc, convexResourceSrc, type SecurityRules } from '../../src/runtime/nuxt/csp'

const URL = 'https://happy-otter-123.convex.cloud'
const SITE_URL = 'https://happy-otter-123.convex.site'

function cspOf(rules: SecurityRules): Record<string, unknown> {
  return (rules.headers as Record<string, unknown>).contentSecurityPolicy as Record<string, unknown>
}

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
  it('allows the deployment origin and, when set, the site origin', () => {
    expect(convexResourceSrc(URL)).toEqual(['https://happy-otter-123.convex.cloud'])
    expect(convexResourceSrc(URL, SITE_URL)).toEqual([
      'https://happy-otter-123.convex.cloud',
      'https://happy-otter-123.convex.site',
    ])
  })

  it('deduplicates a site URL equal to the deployment URL (local stubs)', () => {
    expect(convexResourceSrc('http://127.0.0.1:3210', 'http://127.0.0.1:3210')).toEqual(['http://127.0.0.1:3210'])
  })

  it('returns [] for missing input', () => {
    expect(convexResourceSrc()).toEqual([])
  })
})

describe('applyConvexSecurityDefaults', () => {
  const connectSrc = convexConnectSrc(URL, SITE_URL)
  const resourceSrc = convexResourceSrc(URL, SITE_URL)

  it('tightens unset directives to baseline plus the Convex origins', () => {
    const rules: SecurityRules = {}
    applyConvexSecurityDefaults(rules, connectSrc, resourceSrc)

    const csp = cspOf(rules)
    expect(csp['connect-src']).toEqual(['\'self\'', ...connectSrc])
    expect(csp['img-src']).toEqual(['\'self\'', 'data:', ...resourceSrc])
    expect(csp['media-src']).toEqual(['\'self\'', ...resourceSrc])
  })

  it('appends to user-set directives instead of replacing them', () => {
    const rules: SecurityRules = {
      headers: {
        contentSecurityPolicy: {
          'img-src': ['\'self\'', 'https://cdn.example.com'],
        },
      },
    }
    applyConvexSecurityDefaults(rules, connectSrc, resourceSrc)

    expect(cspOf(rules)['img-src']).toEqual(['\'self\'', 'https://cdn.example.com', ...resourceSrc])
  })

  it('reads a directive written as a space-separated string', () => {
    const rules: SecurityRules = {
      headers: {
        contentSecurityPolicy: {
          'connect-src': '\'self\' https://api.example.com',
        },
      },
    }
    applyConvexSecurityDefaults(rules, connectSrc, resourceSrc)

    expect(cspOf(rules)['connect-src']).toEqual(['\'self\'', 'https://api.example.com', ...connectSrc])
  })

  it('does not duplicate origins already present', () => {
    const rules: SecurityRules = {
      headers: {
        contentSecurityPolicy: {
          'connect-src': ['\'self\'', 'https://happy-otter-123.convex.cloud'],
        },
      },
    }
    applyConvexSecurityDefaults(rules, connectSrc, resourceSrc)

    expect(cspOf(rules)['connect-src']).toEqual(['\'self\'', ...connectSrc])
  })

  it('leaves a directive entirely untouched when there is nothing to add', () => {
    // The dev path: connect-src additions are withheld so the directive is not
    // materialized — creating `connect-src 'self'` would block the Vite HMR /
    // devtools WebSockets, which run on ports `'self'` does not cover.
    const rules: SecurityRules = {}
    applyConvexSecurityDefaults(rules, [], resourceSrc)

    const csp = cspOf(rules)
    expect(csp['connect-src']).toBeUndefined()
    expect(csp['img-src']).toEqual(['\'self\'', 'data:', ...resourceSrc])
    expect(csp['media-src']).toEqual(['\'self\'', ...resourceSrc])
  })

  it('does not materialize headers when there is nothing to add at all', () => {
    // No Convex URL configured: nothing to allow, so nothing is created either.
    const rules: SecurityRules = {}
    applyConvexSecurityDefaults(rules, [], [])
    expect(rules).toEqual({})
  })

  it('respects headers: false and contentSecurityPolicy: false opt-outs', () => {
    const headersOff: SecurityRules = { headers: false }
    applyConvexSecurityDefaults(headersOff, connectSrc, resourceSrc)
    expect(headersOff.headers).toBe(false)

    const cspOff: SecurityRules = { headers: { contentSecurityPolicy: false } }
    applyConvexSecurityDefaults(cspOff, connectSrc, resourceSrc)
    expect((cspOff.headers as Record<string, unknown>).contentSecurityPolicy).toBe(false)
  })
})
