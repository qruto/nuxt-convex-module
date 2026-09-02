import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// The `basic` fixture again, with the nuxt-security integration switched off
// via `convex.security: false`. nuxt-security is a repo devDependency, so the
// module would otherwise auto-detect and register it (see basic.test.ts) —
// this proves the opt-out leaves nuxt-security out entirely rather than only
// skipping the Convex additions to its CSP.

const stub = await startConvexStub({ queryValue: 'hello-from-convex' })
afterAll(() => stub.close())

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  server: true,
  nuxtConfig: {
    convex: {
      url: stub.url,
      betterAuth: false,
      security: false,
    },
  },
})

describe('basic fixture with convex.security: false', () => {
  it('serves the page without nuxt-security headers', async () => {
    const response = await fetch('/')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-security-policy')).toBeNull()
    // Another nuxt-security-only header, to show the module itself stayed out.
    expect(response.headers.get('x-frame-options')).toBeNull()
  })
})
