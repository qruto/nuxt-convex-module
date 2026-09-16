export default defineAppConfig({
  docus: {
    locale: 'en',
    // Left EMPTY on purpose: 'light' / 'dark' here would force one scheme.
    // The site follows the OS instead — the toggle is removed from the
    // header, footer and ⌘K palette (app/components/app overrides), the
    // `d` shortcut is off below, and nuxt.config's colorMode.storageKey
    // keeps any preference a visitor stored while the toggle still
    // existed from being read.
    colorMode: '',
    shortcuts: { toggleColorMode: '' },
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
            depth: ['convex', 'convex-0', 'convex-2', 'convex-3', 'convex-accent', 'concave', 'concave-2', 'concave-ground', 'part-plate', 'part-card', 'part-well', 'part-tray', 'part-dish', 'part-code', 'panel-glass', 'panel-matte'],
            // `part-code-shell` only re-points the gutter's marking, so it is
            // NOT on the depth axis — it composes with part-code.
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

    // The header as a raised GLASS rail — a sheer plate over a real
    // cast, carrying no finish of its own so the section's shows
    // through it. `border-b-0` is load-bearing: --elevation-header's
    // `0 1px 0` solid layer IS the bottom edge now, and leaving the
    // theme's border-b in place draws it twice. See chrome.css.
    //
    // The theme's `backdrop-blur-sm` is switched OFF, not reduced. Any
    // blur wide enough to matter is wider than the grain's own 3px/7px
    // pitch, so it averages the finish under the bar into exactly the
    // flat wash the sheer fill exists to avoid — measured, 8px and even
    // 1px left the bar with a 2-level ripple against the ground's 13.
    // Sheer and unblurred, the pattern comes through at ~40%.
    header: {
      slots: {
        root: 'app-header border-b-0 bg-transparent bg-(image:--gradient-header-image) backdrop-blur-none shadow-(--elevation-header)',
      },
    },

    // The search trigger reads as a FIELD (placeholder text, opens an
    // input), so it is cut in rather than raised — and cut THROUGH the
    // rail to the page ground (concave-ground), not into the rail: the
    // rail is a thin plate, and a pocket that stopped inside it was a
    // point below its surround in dark and read flat (2026-09-16,
    // "improve depth effects for the search bar"). The floor is the page's
    // own tone, ten levels under the rail, and the lip and floor catch
    // come from the eye-level field scope in chrome.css. Hover lifts the
    // placeholder rather than deepening the cut — there is no deeper
    // ground rung to step to. Docus hands it `variant="soft"`, so the
    // convex button rule above lands on it too and these classes have to
    // win — which they do, because they are written later and `depth` is
    // a declared conflict axis (see `tv` at the top of this file).
    // The trailing wrapper becomes the single ⌘K cap (per-key <kbd>
    // bare-ing lives in skin.css — no theme key reaches nested UKbds).
    contentSearchButton: {
      slots: {
        base: 'border-0 ring-0 concave-ground hover:text-highlighted transition-[color,box-shadow]',
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
    // 2. The rails are grooves. An overhead lamp shades the near wall of
    //    a cut and lights the far one, so every rail is two pixels: a
    //    shade outside, a catch inset, one pixel apart — --seam-y in
    //    chrome.css, which also draws the header seam. It is drawn ONCE,
    //    on the list, and runs unbroken: the theme's per-link `after:`
    //    marker (1px, inset 2px top and bottom, rounded) sits on the
    //    shade column and stays transparent until the link is active,
    //    when it turns orange and takes the shade's place — the catch
    //    runs on beside it untouched. It used to carry its own
    //    shade-and-catch pair as well, which stitched a second, rounded
    //    groove over the first one link at a time: a dashed rail.
    //    Section names, page names and their icons are raised: the
    //    marking on the plate, the rails cut into it. The section names
    //    take the domed rung (convex-text-2 — 14px semibold is the floor
    //    it holds at; the shallow rung's two rows say nothing for white
    //    ink on the dark ground), page names and icons the shallow one
    //    (convex-text / convex-icon).
    contentNavigation: {
      slots: {
        listWithChildren: 'border-0 shadow-(--seam-y)',
        trigger: 'convex-text-2',
        linkLeadingIcon: 'convex-icon',
        // Wrap rather than clip: a narrow aside shows the whole name.
        linkTitle: 'whitespace-normal text-clip overflow-visible',
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
          class: { link: 'before:convex', linkTitle: 'convex-text' },
        },
      ],
    },

    // The docs columns. Nuxt UI lays UPage out as a ten-column grid and
    // hands each aside two of them, so both asides scale with the
    // viewport — and Docus nests two UPages (the layout's, holding the
    // sidebar; the page's, holding the TOC), so the TOC got two tenths
    // of eight tenths: 16% of the container, less its own padding. That
    // is ~150px of text at 1440 and ~100px at 1024, where every heading
    // wrapped and the Ecosystem links truncated.
    //
    // The grid is traded for a flex row with FIXED asides: the sidebar
    // and the TOC are each as wide as their content needs wherever they
    // appear, and the article takes what is left. Below lg both fold as
    // before (the header's menu, the TOC's collapsible strip). Between
    // lg and xl the article has no room for a third column, so the TOC
    // folds alone — into the pull tab on the right edge, see
    // DocsAsideRight.vue — and is a column again from xl. The widths are
    // the --docs-*-width tokens in chrome.css.
    //
    // Compound variants, one per aside combination, because the theme's
    // own compound variants come after any slot class and one of them
    // (left + right) re-spans the centre. `lg:flex` beats the slot's
    // `lg:grid` on the display axis; the theme's `col-span` classes go
    // inert outside a grid — which also keeps the `lg:col-span-10` the
    // docs page passes while the assistant is open harmless.
    page: {
      compoundVariants: [
        {
          left: true,
          right: false,
          class: {
            root: 'lg:flex lg:flex-row',
            left: 'lg:w-(--docs-aside-width) lg:shrink-0',
            center: 'lg:flex-1 lg:min-w-0',
          },
        },
        {
          left: false,
          right: true,
          class: {
            root: 'lg:flex lg:flex-row',
            center: 'lg:flex-1 lg:min-w-0',
            right: 'lg:max-xl:hidden lg:w-(--docs-toc-width) lg:shrink-0',
          },
        },
        {
          left: false,
          right: false,
          class: { root: 'lg:flex' },
        },
      ],
    },

    // The docs page header: a mono eyebrow with the glowing accent tick,
    // a display-font title cut into the plate, and the border-b traded
    // for a scribed seam (shade, then catch one pixel below).
    pageHeader: {
      slots: {
        root: 'relative py-8 border-b-0 shadow-(--seam-x)',
        headline:
          'mb-4 font-mono text-xs font-semibold tracking-[0.06em] concave-text text-toned flex items-center gap-1.5 before:content-[\'\'] before:h-[1.5px] before:w-[22px] before:rounded-full before:neon',
        title: 'font-display convex-text-3',
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
        // On desktop the whole panel is a frosted dish on the page
        // (panel-glass, depth.css); the page grain shows through it.
        // The panel goes on the container: the theme's root keeps a
        // `backdrop-blur-sm` at every width for the mobile drawer, which
        // on desktop painted a blurred SQUARE behind the rounded dish —
        // hence the root override. `lg:ps-0` hands the dish the root's
        // 24px of start padding, which the strip below lg needs (it
        // bleeds to the container's edges) and the column does not: the
        // dish then fills its column, with the page gap alone between it
        // and the article.
        root: 'lg:bg-transparent lg:backdrop-blur-none lg:ps-0',
        container: 'lg:panel-glass lg:rounded-(--radius-card) lg:px-3.5 xl:px-5 lg:my-8',
        title: 'convex-text',
        linkText: 'whitespace-normal text-clip overflow-visible',
      },
      // The rail, as a compound variant and NOT a slot: the theme adds
      // its `border-s` from a compound variant of its own, and compound
      // classes land AFTER the slot's, so a `border-0` written in the
      // slot lost — the border stayed, and the inset catch was painted
      // one column inside it: a 1px shade and a 2px light. Extended
      // compound variants are appended after the theme's, so this one
      // wins. The indicator is moved one column left, onto the shade,
      // where the sidebar's marker already sits: the orange bar takes
      // the shade's place and the catch runs on beside it.
      compoundVariants: [
        {
          highlight: true,
          highlightVariant: 'straight',
          class: { list: 'border-0 shadow-(--seam-y)', indicator: '-translate-x-px' },
        },
      ],
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

    // Checkboxes (the security checklist): a recessed well that fills
    // with a raised accent cap when ticked.
    checkbox: {
      slots: {
        base: 'concave ring-0 rounded-(--radius-chip)',
        indicator: 'convex-accent',
      },
    },

    // Landing chrome: display-font titles, no eyebrows — the section
    // titles carry their own meaning (replaces the bespoke
    // LandingSection/LandingEyebrow components).
    //
    // Descriptions carry a two-step emphasis scale so the key things in them
    // scan without turning into a bullet list: `**term**` steps the ink up to
    // highlighted (the capability names), `[term]{.text-primary}` takes the
    // signal orange (the one claim that matters most on the plate). These
    // slots sit OUTSIDE .prose, so <strong> arrives unstyled — that ink step
    // has to be spelled out here or bold reads as plain body copy.
    pageHero: {
      slots: {
        title: 'font-display',
        description: '[&_strong]:font-semibold [&_strong]:text-highlighted',
      },
    },
    pageSection: {
      slots: {
        // More air than the Nuxt UI default (py-16/24/32, gap-8/16):
        // every section is now a screen-tall plate the page snaps to
        // (see THE PLATES in landing.css), and a plate wants margin
        // around its marking. The short plates take most of this from
        // `align-content: center` in the leftover screen; the spec
        // sheet, which is taller than the screen, takes it from here.
        container: 'py-24 sm:py-32 lg:py-40 gap-12 sm:gap-20',
        title: 'font-display',
        description: '[&_strong]:font-semibold [&_strong]:text-highlighted',
      },
    },

    prose: {
      // Headings are raised off the plate — the display rung, with the
      // hard-turned face; the sidebar's group names take the ink-keeping
      // dome (convex-text-2) and the labels the shallow `convex-text`.
      // h1–h3 only: below 18px the two rows fold into the glyph and read
      // as blur, so body copy and h4+ stay plain.
      h1: { slots: { base: 'convex-text-3' } },
      h2: { slots: { base: 'convex-text-3' } },
      h3: { slots: { base: 'convex-text-3' } },
      // Steps: the numbered plates and the rail they hang on are the
      // same parts the sidebar is built from. The rail is the groove
      // (--seam-y, the sidebar tree's own) in place of the theme's
      // `border-s`; each number is a raised titanium plate with the
      // digit stamped into it. The theme's `ring-4 ring-bg` halo — a
      // page-coloured gap that broke the line around each circle — is
      // gone: a plate sits ON the rail and casts onto it, so the line
      // runs under it, as it would. The level strings are Nuxt UI's
      // own with only those tokens swapped; re-diff on a bump.
      steps: {
        base: 'ms-4 border-s-0 shadow-(--seam-y) ps-8 [counter-reset:step]',
        variants: {
          level: {
            2: '[&>h2]:[counter-increment:step] [&>h2]:relative [&>h2]:before:absolute [&>h2]:before:size-8 [&>h2]:before:convex [&>h2]:before:bevel [&>h2]:before:rounded-full [&>h2]:before:concave-text [&>h2]:before:text-toned [&>h2]:before:font-semibold [&>h2]:before:text-sm [&>h2]:before:tabular-nums [&>h2]:before:inline-flex [&>h2]:before:items-center [&>h2]:before:justify-center [&>h2]:before:-ms-[48.5px] [&>h2]:before:mt-0 [&>h2]:before:content-[counter(step)] [&>h2>a>span.absolute]:hidden',
            3: '[&>h3]:[counter-increment:step] [&>h3]:relative [&>h3]:before:absolute [&>h3]:before:size-7 [&>h3]:before:inset-x-0.5 [&>h3]:before:convex [&>h3]:before:bevel [&>h3]:before:rounded-full [&>h3]:before:concave-text [&>h3]:before:text-toned [&>h3]:before:font-semibold [&>h3]:before:text-sm [&>h3]:before:tabular-nums [&>h3]:before:inline-flex [&>h3]:before:items-center [&>h3]:before:justify-center [&>h3]:before:-ms-[48.5px] [&>h3]:before:content-[counter(step)] [&>h3>a>span.absolute]:hidden',
            4: '[&>h4]:[counter-increment:step] [&>h4]:relative [&>h4]:before:absolute [&>h4]:before:size-7 [&>h4]:before:inset-x-0.5 [&>h4]:before:convex [&>h4]:before:bevel [&>h4]:before:rounded-full [&>h4]:before:concave-text [&>h4]:before:text-toned [&>h4]:before:font-semibold [&>h4]:before:text-sm [&>h4]:before:tabular-nums [&>h4]:before:inline-flex [&>h4]:before:items-center [&>h4]:before:justify-center [&>h4]:before:-ms-[48.5px] [&>h4]:before:content-[counter(step)] [&>h4>a>span.absolute]:hidden',
          },
        },
      },
      // Every other line the prose draws is the same cut. A rule
      // between sections is the scribe (chrome.css); a quote's bar and
      // the dividers of a field group are the sidebar's groove and the
      // page header's seam. The dividers move from the top of each
      // field to the foot of the one before it, which also evens the
      // air on both sides of the line (the theme had 40px above, 0
      // below).
      hr: { base: 'border-0 scribe my-12' },
      blockquote: { base: 'border-s-0 shadow-(--seam-y) ps-4 italic' },
      fieldGroup: { base: 'my-5 divide-y-0 *:not-last:pb-5 *:not-last:shadow-(--seam-x)' },
      // Inline code → a raised chip sitting on the baseline. `inline`
      // rather than the theme's `inline-block` so a chip at a line's end
      // wraps with the text instead of dropping whole to the next line.
      code: {
        base: 'inline px-1.5 py-px font-mono font-medium text-[0.875em] rounded-(--radius-chip) align-baseline',
        variants: {
          color: { neutral: 'border-0 convex-0 text-highlighted' },
        },
      },
      // A link around a chip: the chip takes the link colour and lifts
      // on hover (the theme's dashed-border affordance needs a border).
      a: {
        base: '[&>code]:text-primary hover:[&>code]:convex',
      },
      // Code blocks → the deep tray, face and all. They used to take the
      // cast without the face on the belief that Shiki painted its own
      // background in there; its editor.background never reaches this
      // pre (the computed fill was the theme's bg-muted), so the well
      // sat on a muted tile — a step ABOVE the page in light — and read
      // flat beside every other cut (2026-09-16, the light-room pass).
      // `rounded-lg` keeps the radius it had; the tray's own rung would
      // be the well's 12.
      pre: { slots: { base: 'rounded-lg border-0 part-tray' } },
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
    // JSON-LD: the site is a free developer tool (read by Docus's useSeo).
    schema: {
      type: 'SoftwareApplication',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      price: 0,
      priceCurrency: 'USD',
      sameAs: ['https://github.com/qruto/nuxt-convex-module', 'https://www.npmjs.com/package/nuxt-convex-module'],
    },
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
