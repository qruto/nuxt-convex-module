export default defineAppConfig({
  docus: {
    locale: 'en',
    colorMode: '',
  },

  ui: {
    colors: {
      // Custom ramp declared in app.css (fluorescent signal orange);
      // the runtime bridges it to --ui-color-primary-*.
      primary: 'signal',
      info: 'signal', // no blue in the palette
      // Pure-grey neutral (zinc carries a blue cast) — titanium has no hue.
      neutral: 'neutral',
      success: 'green',
      warning: 'amber',
      error: 'red',
    },

    // Depth press physics for every button (replaces the bespoke
    // SiteButton). compoundVariants APPEND after Nuxt UI's defaults;
    // tailwind-merge resolves conflicts in our favor.
    button: {
      slots: {
        base: 'transition-[color,background-color,box-shadow,translate] duration-150 ease-out',
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class:
            'border-0 bg-(image:--grad-accent) hover:bg-(image:--grad-accent-press) active:bg-(image:--grad-accent-press) shadow-(--elev-accent) active:shadow-(--inset-1) active:translate-y-[0.5px] disabled:shadow-(--elev-accent)',
        },
        {
          color: 'neutral',
          variant: 'outline',
          class:
            'ring-0 bg-(image:--grad-surface) shadow-(--elev-1) hover:text-primary active:bg-(image:--grad-sink) active:shadow-(--inset-1) active:translate-y-[0.5px] disabled:shadow-(--elev-1)',
        },
      ],
    },

    // Softly lifted header bar (the hairline stays UHeader's border-b).
    header: { slots: { root: 'shadow-(--elev-header)' } },

    // The search trigger reads as a FIELD (placeholder text, opens an
    // input) → a concave well; hover/active deepen the dish. The
    // trailing wrapper becomes the single ⌘K cap (per-key <kbd>
    // bare-ing lives in app.css — no theme key reaches nested UKbds).
    contentSearchButton: {
      slots: {
        base: 'border-0 ring-0 bg-(image:--grad-sink) shadow-(--inset-1) hover:shadow-(--inset-2) active:shadow-(--inset-2) transition-[color,box-shadow]',
        trailing: 'gap-0 px-1.5 rounded-[5px] bg-(image:--grad-surface) shadow-(--elev-0)',
      },
    },

    // Sidebar links: hover/active become depth pills on the ::before
    // layer the theme already ships.
    contentNavigation: {
      compoundVariants: [
        {
          disabled: false,
          active: false,
          variant: 'pill',
          class: { link: 'hover:before:bg-elevated hover:before:shadow-(--elev-0)' },
        },
        {
          variant: 'pill',
          active: true,
          class: { link: 'before:bg-(image:--grad-surface) before:shadow-(--elev-1)' },
        },
      ],
    },

    // Landing chrome: mono eyebrows with the glowing accent tick,
    // display-font titles (replaces the bespoke LandingSection/
    // LandingEyebrow components).
    pageHero: {
      slots: {
        headline:
          'font-mono text-xs font-semibold tracking-[0.14em] uppercase etched text-toned before:content-[\'\'] before:h-[3px] before:w-[22px] before:rounded-full before:bg-primary before:shadow-(--glow-primary-soft)',
        title: 'font-display',
      },
    },
    pageSection: {
      slots: {
        headline:
          'font-mono text-xs font-semibold tracking-[0.14em] uppercase etched text-toned before:content-[\'\'] before:h-[3px] before:w-[22px] before:rounded-full before:bg-primary before:shadow-(--glow-primary-soft)',
        title: 'font-display',
      },
    },

    prose: {
      // Inline code → tiny recessed chip.
      code: {
        variants: {
          color: { neutral: 'border-0 bg-muted shadow-(--inset-1) text-highlighted' },
        },
      },
      // Code blocks → carved wells.
      pre: { slots: { base: 'rounded-lg border-default shadow-(--inset-1)' } },
      // kbd in docs → raised key cap.
      kbd: { base: 'shadow-(--elev-0)' },
      // MDC ::card tiles → bead-blast plates that raise on hover.
      card: {
        slots: {
          base: 'bg-elevated shadow-(--elev-1) hover:shadow-(--elev-2) transition-[box-shadow,border-color,background-color]',
        },
      },
    },
  },

  seo: {
    titleTemplate: '%s · Nuxt Convex',
    title: 'Nuxt Convex',
    description:
      'The Convex client for Vue & Nuxt — reactive live queries, mutations, actions, pagination, file storage and SSR, auto-imported and typed against your deployment.',
  },

  header: {
    title: 'Nuxt Convex',
    // The wordless mark (transparent, no plate) — the full artwork, shadows
    // and all, everywhere it appears (user's call: one consistent mark over a
    // flattened small-size variant). The browser-tab favicons are transparent
    // PNG/ICO rasterised from this same mark. One asset for both schemes: the
    // Nuxt peak and the Convex swirl carry their own color.
    logo: {
      light: '/logo.svg',
      dark: '/logo.svg',
      alt: 'Nuxt Convex',
    },
  },

  // No `socials.github` — Docus's footer renders one button per social AND
  // another for `github.url`, so listing GitHub in both shows the mark twice.
  github: {
    url: 'https://github.com/qruto/nuxt-convex-module',
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
