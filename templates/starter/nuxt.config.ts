// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['nuxt-convex-module'],
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Nuxt + Convex',
      htmlAttrs: { lang: 'en' },
    },
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-07-15',
})
