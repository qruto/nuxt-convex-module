export default defineAppConfig({
  docus: {
    locale: 'en',
    colorMode: '',
  },

  // No `navigation.sub`: the sidebar carries the WHOLE tree, every section and
  // every page at once, the way an ordinary docs site reads. `sub: 'aside'`
  // would put the four sections in a UPageAnchors switcher above the sidebar
  // and scope the tree below it to the one you are in — you would have to pick
  // a section before you could see what was in it. Docus never collapses groups
  // on desktop (DocsAsideLeftBody hardcodes `:collapsible="false"`), so the
  // length is held down at the source instead: the generated TypeDoc modules
  // that would nest three folders deep are kept out of the tree — see the note
  // in scripts/typedoc-postprocess.mjs.

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
            'border-0 bg-(image:--grad-accent) hover:bg-(image:--grad-accent-press) active:top-px active:relative active:bg-(image:--grad-accent-press) shadow-(--elev-accent) active:shadow-(--inset-1) active:translate-y-[0.5px] disabled:shadow-(--elev-accent)',
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
    //
    // Descriptions carry a two-step emphasis scale so the key things in them
    // scan without turning into a bullet list: `**term**` steps the ink up to
    // highlighted (the capability names), `[term]{.text-primary}` takes the
    // signal orange (the one claim that matters most on the plate). These
    // slots sit OUTSIDE .prose, so <strong> arrives unstyled — that ink step
    // has to be spelled out here or bold reads as plain body copy.
    pageHero: {
      slots: {
        headline:
          'font-mono text-xs font-semibold tracking-[0.14em] uppercase etched text-toned before:content-[\'\'] before:h-[3px] before:w-[22px] before:rounded-full before:bg-primary before:shadow-(--glow-primary-soft)',
        title: 'font-display',
        description: '[&_strong]:font-semibold [&_strong]:text-highlighted',
      },
    },
    pageSection: {
      slots: {
        headline:
          'font-mono text-xs font-semibold tracking-[0.14em] uppercase etched text-toned before:content-[\'\'] before:h-[3px] before:w-[22px] before:rounded-full before:bg-primary before:shadow-(--glow-primary-soft)',
        title: 'font-display',
        description: '[&_strong]:font-semibold [&_strong]:text-highlighted',
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
      'The Nuxt module for Convex — reactive live queries, mutations, actions, pagination, file storage and SSR, auto-imported and typed against your deployment. The same client runs standalone in any Vue app.',
  },

  header: {
    title: 'Nuxt Convex',
    // The wordless mark (transparent, no plate) — the same artwork everywhere
    // it appears, at every size (user's call: one consistent mark over a
    // separate small-size variant). It carries inner shading only, no cast
    // shadow, so it needs no ground of its own. The browser-tab favicons are
    // transparent PNG/ICO rasterised from this same mark. One asset for both
    // schemes: the Nuxt peak and the Convex swirl carry their own color.
    // `h-8` overrides Docus's default `h-6`: the mark is line art (hollow
    // triangle, open ring), so at 24px its limbs land on ~2px with a half-lit
    // pixel either side — 43% of the inked pixels are antialias fringe rather
    // than color, which reads as blur. 32px gives every stroke a solid core.
    logo: {
      light: '/logo.svg',
      dark: '/logo.svg',
      alt: 'Nuxt Convex',
      class: 'h-8',
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
