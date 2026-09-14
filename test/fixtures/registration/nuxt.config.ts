import MyModule from '../../../src/module'

// Loaded by test/module/registration.test.ts through `loadNuxt`, never built.
// package.json declares Better Auth and nuxt-security, so auto-detection turns
// both on; the test overrides options per case.
export default defineNuxtConfig({
  modules: [MyModule],
  convex: {
    url: 'https://example.convex.cloud',
    siteUrl: 'https://example.convex.site',
  },
})
