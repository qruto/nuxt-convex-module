// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['nuxt-convex-module'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Nuxt Convex Starter',
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;600&family=Kode+Mono&display=swap' },
        { rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=technor@700&display=swap' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
})
