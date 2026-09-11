// https://nuxt.com/docs/api/configuration/nuxt-config
//
// This is the module's own dev harness, not an app — nothing builds it. It
// exists so `@nuxt/eslint` and `@nuxt/test-utils` are configured in one place.
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
  ],
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'only-multiline',
        braceStyle: '1tbs',
      },
    },
  },
})
