import MyModule from '../../../src/module'

// What a page pays for Better Auth (test/e2e/lazy-auth-client.test.ts): `/`
// reads the auth state and never calls the client, `/account` calls it on a
// click. Placeholders only: the e2e run points both URLs at the Convex stub.
export default defineNuxtConfig({
  modules: [MyModule],
  convex: {
    url: 'https://example.convex.cloud',
    siteUrl: 'https://example.convex.site',
  },
})
