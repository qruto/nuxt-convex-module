export default defineAppConfig({
  docus: {
    locale: 'en',
    colorMode: '',
  },

  ui: {
    colors: {
      primary: 'orange',
      // Pure-grey neutral (zinc carries a blue cast) — titanium has no hue.
      neutral: 'neutral',
      info: 'orange',
    },
  },

  seo: {
    titleTemplate: '%s · Nuxt Convex',
    title: 'Nuxt Convex',
    description:
      'Convex for Vue & Nuxt — a faithful port of Convex\'s official React/Next integration, with opt-in Better Auth and Polar.',
  },

  header: {
    title: 'Nuxt Convex',
    logo: {
      light: '/favicon.svg',
      dark: '/favicon.svg',
      alt: 'Nuxt Convex',
    },
  },

  socials: {
    github: 'https://github.com/qruto/nuxt-convex-kit',
  },

  github: {
    url: 'https://github.com/qruto/nuxt-convex-kit',
    branch: 'main',
    rootDir: 'website',
  },

  toc: {
    title: 'On this page',
    bottom: {
      title: 'Ecosystem',
      links: [
        {
          icon: 'i-simple-icons-nuxt',
          label: 'Nuxt docs',
          to: 'https://nuxt.com',
          target: '_blank',
        },
        {
          icon: 'i-simple-icons-convex',
          label: 'Convex docs',
          to: 'https://docs.convex.dev',
          target: '_blank',
        },
        {
          icon: 'i-lucide-shield-check',
          label: 'Better Auth docs',
          to: 'https://www.better-auth.com',
          target: '_blank',
        },
      ],
    },
  },
})
