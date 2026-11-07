import MyModule from '../../../src/module'

// The `registration` fixture with `nuxt-security` listed ahead of the module,
// which overrides can't do: they append to `modules`. Loaded by
// test/module/registration.test.ts.
export default defineNuxtConfig({
  modules: ['nuxt-security', MyModule],
  convex: {
    url: 'https://example.convex.cloud',
    siteUrl: 'https://example.convex.site',
  },
})
