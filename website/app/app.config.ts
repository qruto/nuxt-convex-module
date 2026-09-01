export default defineAppConfig({
  docus: {
    locale: 'en',
    colorMode: '',
  },

  // No `navigation.sub`: the sidebar carries the WHOLE tree, every section and
  // every page at once, the way an ordinary docs site reads. `sub: 'aside'` put
  // the four sections in a UPageAnchors switcher above the sidebar and scoped
  // the tree below it to the one you were in — you had to pick a section before
  // you could see what was in it. Docus never collapses groups on desktop
  // (DocsAsideLeftBody hardcodes `:collapsible="false"`), so the length is held
  // down at the source instead: the generated TypeDoc modules that would nest
  // three folders deep are kept out of the tree — see the note in
  // scripts/typedoc-postprocess.mjs.

  ui: {
    // A surface has ONE shape. Nuxt UI merges every theme layer into a
    // single class list with tailwind-merge, which only knows how to
    // resolve conflicts it has been told about — so the depth recipes
    // are declared here as one axis, exactly like `bg-*` or `p-*`, and
    // the last one written wins. Without this the tie would fall to
    // Tailwind's alphabetical emission order (convex after concave),
    // which is not something anyone should have to know: the search
    // field is a neutral `soft` button in Docus's markup, so it picks
    // up the convex button rule AND its own concave one.
    tv: {
      twMergeConfig: {
        extend: {
          classGroups: {
            depth: ['convex', 'convex-0', 'convex-2', 'convex-3', 'convex-accent', 'concave', 'concave-2'],
          },
        },
      },
    },

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

    // Every button is a real part: convex at rest, lifting under the
    // cursor, seating into its own recess when pressed. The whole
    // sentence is written in depth.css's vocabulary — one word per
    // material, never a shadow value. compoundVariants APPEND after
    // Nuxt UI's defaults, and tailwind-merge resolves the conflicts in
    // our favor.
    button: {
      slots: {
        base: 'transition-[color,background-color,box-shadow,translate] duration-150 ease-out',
      },
      compoundVariants: [
        // The accent part — face, keyline, cast, cut label, hover and
        // press all live in `convex-accent` (depth.css), because they
        // are one material's behaviour rather than six decisions. Only
        // the ink is set here, and it is ONE value: the plate is the
        // same orange in both schemes (--accent-face), so the label cut
        // into it is the same burnt shade too. The dark scheme used to
        // step it up to 700, which on the old pastel dark face read at
        // 1.96:1 — half the light scheme's contrast. 900 holds 3.10:1
        // on this fill, so do not lighten it.
        {
          color: 'primary',
          variant: 'solid',
          class: {
            base: 'border-0 text-primary-900 convex-accent',
            // Mask-rendered icons take no text-shadow — same cut, drawn
            // as drop-shadows, so the glyphs and the icon sit at one depth.
            leadingIcon: 'concave-icon',
            trailingIcon: 'concave-icon',
          },
        },
        {
          color: 'neutral',
          variant: 'outline',
          class:
            'ring-0 convex hover:text-primary active:concave active:translate-y-[0.5px]',
        },
        // Docus renders the docs' "Copy page" group as variant="soft",
        // which the theme leaves completely unstyled — so the one chip
        // at the top of every doc page was the only flat control on the
        // site. Same physics as the outline rule above.
        {
          color: 'neutral',
          variant: 'soft',
          class:
            'convex hover:convex-2 hover:text-highlighted active:concave active:translate-y-[0.5px]',
        },
      ],
    },

    // The header as a raised metal rail — a lighter plate with the
    // brushed grain running along it, over a real cast. `border-b-0`
    // is load-bearing: --elevation-header's `0 1px 0` solid layer IS the
    // bottom edge now, and leaving the theme's border-b in place draws
    // it twice. See chrome.css for the recipe.
    header: {
      slots: {
        root: 'app-header border-b-0 bg-transparent bg-(image:--gradient-header-image) shadow-(--elevation-header)',
      },
    },

    // The search trigger reads as a FIELD (placeholder text, opens an
    // input), so it is cut in rather than raised; hover/active deepen
    // the dish. Docus hands it `variant="soft"`, so the convex button
    // rule above lands on it too and these classes have to win — which
    // they do, because they are written later and `depth` is a declared
    // conflict axis (see `tv` at the top of this file).
    // The trailing wrapper becomes the single ⌘K cap (per-key <kbd>
    // bare-ing lives in skin.css — no theme key reaches nested UKbds).
    contentSearchButton: {
      slots: {
        base: 'border-0 ring-0 concave hover:concave-2 active:concave-2 transition-[color,box-shadow]',
        trailing: 'gap-0 px-1.5 rounded-[5px] convex-0',
      },
    },

    // Sidebar. Two things happen here.
    //
    // 1. The depth rules are keyed `variant: 'link'`, NOT 'pill'.
    //    Docus's DocsAsideLeftBody passes
    //    `:variant="contentNavVariants.variant ?? 'link'"`, reading
    //    `ui.contentNavigation.defaultVariants` — which this file has
    //    never set. Every 'pill'-keyed rule here was therefore dead and
    //    had never rendered. Retargeting to 'link' keeps the sidebar's
    //    rail-and-ink language (the pill default would fill every
    //    active row) and finally turns the depth on.
    //
    // 2. The rails get their reflected light. An overhead lamp lights
    //    the FAR wall of a groove, so both the grey nesting rail and
    //    the orange active marker carry a 1px catch on their right —
    //    --rail-catch, chrome.css. The rail itself is the theme's
    //    `border-s` on listWithChildren; an inset shadow lands flush
    //    against its inner face.
    contentNavigation: {
      slots: {
        listWithChildren: 'border-(--rail-shade) shadow-[inset_1px_0_0_var(--rail-catch)]',
        // Section names — the only nav text heavy enough to hold a cut.
        trigger: 'concave-text',
      },
      compoundVariants: [
        {
          disabled: false,
          active: false,
          variant: 'link',
          class: { link: 'hover:before:bg-elevated hover:before:shadow-(--elevation-0)' },
        },
        {
          variant: 'link',
          active: true,
          class: { link: 'before:convex' },
        },
        {
          highlight: true,
          level: true,
          class: { link: 'after:shadow-[1px_0_0_var(--rail-catch)]' },
        },
      ],
    },

    // The docs page header: the same mono eyebrow the landing sections
    // wear, a display-font title cut into the plate, and the border-b
    // traded for a scribed seam (shade, then catch one pixel below).
    pageHeader: {
      slots: {
        root: 'relative py-8 border-b-0 shadow-(--seam-x)',
        headline:
          'mb-2.5 font-mono text-xs font-semibold tracking-[0.14em] uppercase concave-text text-toned flex items-center gap-1.5 before:content-[\'\'] before:h-[3px] before:w-[22px] before:rounded-full before:bg-primary before:shadow-(--glow-primary-soft)',
        title: 'font-display concave-text',
        // Hook for the field-group seam patch in chrome.css — the
        // divider class lives in Docus's own template.
        links: 'docs-page-links',
      },
    },

    // "On this page". Docus defaults this TOC to highlight-variant
    // "circuit", whose rail is a MASKED div — a mask clips the
    // element's own shadows and filters, so a groove's reflected
    // light can't be painted on it at all. `straight` draws the same
    // rail as a plain `border-s` plus a 1px indicator, which takes
    // the catch exactly the way the sidebar's does; one rail language
    // across both asides instead of two. (Read via Docus's
    // useUIConfig, which looks at defaultVariants.)
    contentToc: {
      defaultVariants: { highlightVariant: 'straight' },
      slots: {
        title: 'concave-text',
        list: 'border-(--rail-shade) shadow-[inset_1px_0_0_var(--rail-catch)]',
        indicator: 'shadow-[1px_0_0_var(--rail-catch)]',
      },
    },

    // The dashed rules in the right aside. A dashed border can only be
    // one line, and one line has no depth — so the border is traded for
    // the two-row stitched cut in chrome.css, which paints a dashed
    // shade and a dashed catch in phase with each other.
    separator: {
      variants: {
        type: {
          dashed: { border: 'border-dashed seam-dashed' },
        },
      },
    },

    // Prev/next: bead-blast plates, like the MDC ::card tiles below.
    contentSurround: {
      slots: {
        link: 'border-0 convex hover:convex-2 transition-[box-shadow,background-color]',
      },
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
          'font-mono text-xs font-semibold tracking-[0.14em] uppercase concave-text text-toned before:content-[\'\'] before:h-[3px] before:w-[22px] before:rounded-full before:bg-primary before:shadow-(--glow-primary-soft)',
        title: 'font-display',
        description: '[&_strong]:font-semibold [&_strong]:text-highlighted',
      },
    },
    pageSection: {
      slots: {
        headline:
          'font-mono text-xs font-semibold tracking-[0.14em] uppercase concave-text text-toned before:content-[\'\'] before:h-[3px] before:w-[22px] before:rounded-full before:bg-primary before:shadow-(--glow-primary-soft)',
        title: 'font-display',
        description: '[&_strong]:font-semibold [&_strong]:text-highlighted',
      },
    },

    prose: {
      // Headings get the 1px marking — a light catch under the glyphs,
      // so they read as cut into the plate rather than printed on it.
      // h1–h3 only: `concave-text` is a one-pixel shadow, and much
      // below 18px it stops reading as a cut and starts reading as a
      // halo. Body copy stays plain for the same reason.
      h1: { slots: { base: 'concave-text' } },
      h2: { slots: { base: 'concave-text' } },
      h3: { slots: { base: 'concave-text' } },
      // Inline code → tiny recessed chip.
      code: {
        variants: {
          color: { neutral: 'border-0 bg-muted shadow-(--inset-shadow-1) text-highlighted' },
        },
      },
      // Code blocks → carved wells. The one place that takes the cast
      // WITHOUT the face: Shiki paints its own background in there, and
      // a dish gradient over it would fight the syntax theme.
      pre: { slots: { base: 'rounded-lg border-default shadow-(--inset-shadow-1)' } },
      // kbd in docs → raised key cap.
      kbd: { base: 'shadow-(--elevation-0)' },
      // MDC ::card tiles → bead-blast plates that raise on hover.
      card: {
        slots: {
          base: 'bg-elevated shadow-(--elevation-1) hover:shadow-(--elevation-2) transition-[box-shadow,border-color,background-color]',
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
