import { name as packageName } from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/test-utils',
    [
      '@codecov/nuxt-plugin',
      {
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: packageName,
        uploadToken: process.env.CODECOV_TOKEN,
      },
    ],
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
