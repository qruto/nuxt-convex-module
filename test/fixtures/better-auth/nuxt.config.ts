import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  convex: {
    // Placeholders only — the e2e run overrides these (see
    // test/e2e/better-auth-proxy.test.ts) with the local Convex stub server's
    // URL. `example.convex.*` are reserved example hosts (RFC 2606), never real
    // deployments. `betterAuth` is left unset: the repo devDependency
    // auto-enables the integration, registering the `/api/auth/**` proxy under test.
    url: 'https://example.convex.cloud',
    siteUrl: 'https://example.convex.site',
  },
})
