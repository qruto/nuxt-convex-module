import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  convex: {
    // Placeholder only — the e2e run overrides this (see test/e2e/basic.test.ts)
    // with the local Convex stub server's URL. `example.convex.cloud` is a
    // reserved example host (RFC 2606), never a real deployment.
    url: 'https://example.convex.cloud',
    // @convex-dev/better-auth is a repo devDependency, so it would
    // auto-enable; force it off so this fixture exercises the base client
    // path (plugin.ts) that the repo's own apps never hit.
    betterAuth: false,
  },
})
