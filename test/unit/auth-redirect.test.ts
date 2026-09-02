import { describe, expect, it } from 'vitest'
import { resolveAuthRedirect } from '../../src/runtime/better-auth/vue/redirect'

// The `auth` middleware sends unauthenticated visitors to `?redirect=<path>`.
// The query is attacker-controllable, so a login page that navigates to it
// verbatim is an open redirect — this is the guard that consumes it safely.

describe('resolveAuthRedirect', () => {
  it('keeps a same-origin path, with its query and hash', () => {
    expect(resolveAuthRedirect('/dashboard')).toBe('/dashboard')
    expect(resolveAuthRedirect('/orders?page=2')).toBe('/orders?page=2')
    expect(resolveAuthRedirect('/docs#install')).toBe('/docs#install')
    expect(resolveAuthRedirect('/a?b=1#c')).toBe('/a?b=1#c')
  })

  it('rejects absolute URLs to another origin', () => {
    expect(resolveAuthRedirect('https://evil.example')).toBe('/')
    expect(resolveAuthRedirect('http://evil.example/path')).toBe('/')
  })

  it('rejects scheme-relative and backslash authority forms', () => {
    // The classic bypasses: both parse as an authority, not a path.
    expect(resolveAuthRedirect('//evil.example')).toBe('/')
    expect(resolveAuthRedirect('//evil.example/path')).toBe('/')
    expect(resolveAuthRedirect('/\\evil.example')).toBe('/')
    expect(resolveAuthRedirect('/\\/evil.example')).toBe('/')
  })

  // Regression: the URL parser resolves dot segments *inside* the path, so
  // these all begin with a single slash — passing an input-only check — yet
  // serialize to `//evil.example`, a protocol-relative URL.
  it('rejects paths that normalize into a protocol-relative URL', () => {
    for (const candidate of [
      '/..//evil.example',
      '/.//evil.example',
      '/x/..//evil.example',
      '/%2e%2e//evil.example',
      '/../\\evil.example',
      '/a/b/../..//evil.example',
      '/..//evil.example/pay?amount=1',
    ]) {
      expect(resolveAuthRedirect(candidate), candidate).toBe('/')
    }
  })

  it('never returns a value that re-resolves to another origin', () => {
    // The property the guard exists to guarantee, asserted directly over a
    // spread of hostile shapes rather than one example at a time.
    const tokens = ['/', '\\', '.', '..', '%2e', 'a', ':', '@', '?', '#']
    const candidates: string[] = []
    for (const a of tokens) {
      for (const b of tokens) {
        for (const c of tokens) candidates.push(`/${a}${b}${c}evil.example`)
      }
    }
    for (const candidate of candidates) {
      const result = resolveAuthRedirect(candidate)
      expect(new URL(result, 'http://app.invalid').origin, candidate).toBe('http://app.invalid')
    }
  })

  it('rejects non-http schemes', () => {
    expect(resolveAuthRedirect('javascript:alert(1)')).toBe('/')
    // eslint-disable-next-line no-script-url
    expect(resolveAuthRedirect('data:text/html,<script>alert(1)</script>')).toBe('/')
  })

  it('rejects anything that is not a leading-slash string', () => {
    expect(resolveAuthRedirect(undefined)).toBe('/')
    expect(resolveAuthRedirect(null)).toBe('/')
    expect(resolveAuthRedirect('')).toBe('/')
    expect(resolveAuthRedirect('dashboard')).toBe('/')
    expect(resolveAuthRedirect(42)).toBe('/')
    // A repeated `?redirect=` arrives as an array: ambiguous, so refused
    // rather than silently picking the entry the attacker did not intend.
    expect(resolveAuthRedirect(['/safe', 'https://evil.example'])).toBe('/')
  })

  it('normalizes traversal rather than passing it through', () => {
    expect(resolveAuthRedirect('/a/../../etc')).toBe('/etc')
  })

  it('honours a custom fallback', () => {
    expect(resolveAuthRedirect('https://evil.example', '/home')).toBe('/home')
    expect(resolveAuthRedirect(undefined, '/home')).toBe('/home')
    // A valid destination still wins over the fallback.
    expect(resolveAuthRedirect('/dashboard', '/home')).toBe('/dashboard')
  })
})
