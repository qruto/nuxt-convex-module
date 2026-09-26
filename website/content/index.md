---
title: nuxt-convex-module
seo:
  title: Use Convex backend in a Nuxt application
  description: "Connects a Nuxt app to a Convex backend: live queries, mutations, actions, pagination, file storage and SSR, auto-imported and typed against your deployment. The same Vue client runs without Nuxt; Better Auth, Clerk, Auth0 and Polar are opt-in."
---

:::u-page-hero
---
orientation: horizontal
class: "landing-hero-ground landing-panel"
ui:
  # Past 1280 the panel track is the plate's own width and the copy takes
  # the rest; below it the theme's halves stand (at 1024 there is no slack
  # to redistribute).
  container: "xl:grid-cols-[minmax(0,1fr)_32rem] xl:gap-x-20"
  header: "motion-safe:animate-fade-up"
  title: "landing-billet"
  # The relief headline is a physical object on the plate: it needs a
  # margin the way a stamped part needs clearance. Two points off the
  # theme's own scale so the copy reads as the sentence under a headline,
  # not a second one; `text-pretty` so the closer's last line never
  # orphans a word.
  description: "mt-8 text-base text-pretty sm:text-lg/7"
  # The keys come first, the spec strip under them (2026-09-14). The
  # theme renders #body above the footer, so the wrapper becomes a
  # column and the body is ordered last; the footer keeps the theme's
  # distance from the text and the strip closes up under the keys.
  wrapper: "flex flex-col"
  footer: "mt-8 sm:mt-10"
  body: "order-last mt-10"
links:
  - label: get started
    to: /getting-started/introduction
    icon: i-nc-book-open
    color: primary
    # A KEY cut to a fixed 160x44: the page's one primary control, sized
    # like a switch rather than a link. `hard-cast` trades the soft bloom
    # for a stepped contact shade (depth.css).
    class: h-11 min-w-40 justify-center px-5 text-lg hard-cast
    ui:
      leadingIcon: size-4.5
      # Centred on the letters, not the em box; `overflow-visible!` keeps
      # the descender of the g from the theme's `truncate` clip.
      label: "[text-box:trim-both_cap_alphabetic] overflow-visible!"
  - label: github
    to: https://github.com/qruto/nuxt-convex-module
    target: _blank
    icon: i-simple-icons-github
    color: neutral
    variant: ghost
    class: text-lg
    ui:
      label: "[text-box:trim-both_cap_alphabetic] overflow-visible!"
---
<!-- ONE FENCE: the code that runs the panel under it. The plate types
     this once and is live from the first paint. `board` is one
     subscription — the ledger's rows and today's count per key in one
     consistent snapshot; `send` is the key press. -->
::landing-hero-panel
```ts
const { data: board } =
  await useAsyncQuery(api.reactions.board)
const send = useMutation(api.reactions.send)
```
::

#title
::hero-billet
[Use]{.billet-part} [:brand-convex backend]{.billet-part}\
[in a]{.billet-part} [:brand-nuxt application]{.billet-part}
::

#description
<!-- THE FEATURES, and only the features. The board is the reason to
     read on — six lines of split-flap type, each a mark, a feature and
     every composable that IS that feature (LandingCapabilities.vue),
     clattering in when the hero comes into view. What Nuxt is and what
     Convex is belongs to plate two (#names below), so the hero column
     ends on the board. -->
:landing-capabilities

#body
<!-- The spec strip — version, the three peer ranges, and the upstream
     Convex release the port matches — cut into the ground under the
     keys, the copy column's full width. The peer ranges are this page's
     copy and travel as props (convex is the module's peer range, ^1.40);
     the version and the ported Convex figure the component reads for
     itself. -->
:landing-version-chip{nuxt="≥ 4.1" vue="≥ 3.5" convex="≥ 1.40"}

#bottom
:landing-services
:::

:::u-page-section
---
id: names
class: "landing-mill-hatch landing-panel border-b border-default"
---
<!-- NO TITLE, NO DESCRIPTION: the drawing is the whole plate. Two parts,
     the module as the fitting between them, and one line under each name
     — anything written above it would say the same thing twice. -->
#body
:landing-coupling
:::

:::u-page-section
---
id: ships
class: "landing-mill-grid landing-panel landing-reveal border-b border-default"
---
#title
:concave-text[Everything the module ships]

#body
:landing-tour
:::

:::u-page-section
---
id: live
class: "landing-mill-rings landing-panel landing-reveal border-b border-default"
---
#title
:concave-text[One table, live in every client]

#description
<!-- The setup carries the accent, the payoff runs plain — the same order
     the hero sets. Hard break so each lands on its own line. -->
[Flip a switch, drag the fader, send a pulse.]{.text-primary}\
Every instrument is a row in one table, and every browser on this page has it on the same commit.

#body
::landing-live
```ts
const { data: switches } =
  await useAsyncQuery(api.switches.list)

const flip = useMutation(api.switches.flip)
  .withOptimisticUpdate((store, { position }) => {
    // the knob moves before the round trip
  })
```
::
:::

:::u-page-section
---
id: anywhere
class: "landing-mill-hatch landing-panel landing-reveal border-b border-default"
---
#title
:concave-text[Nuxt, or plain Vue?]

#description
<!-- One claim, one switch: throw it and only the setup changes. -->
Throw the switch. The setup changes; the component does not.

#body
:landing-anywhere
:::

:::u-page-section
---
id: deploy
class: "landing-mill-knurl landing-panel landing-reveal border-b border-default"
links:
  # THE SAME KEY AS THE HERO'S: one primary control, one size, one cast.
  - label: install the kit
    to: /getting-started/installation
    trailingIcon: i-nc-arrow-right
    color: primary
    class: h-11 min-w-40 justify-center px-5 text-lg hard-cast
    ui:
      trailingIcon: size-4.5
      label: "[text-box:trim-both_cap_alphabetic] overflow-visible!"
  - label: see it running live
    to: /guide/queries
    color: neutral
    variant: outline
    class: h-11 px-5 text-lg
    ui:
      label: "[text-box:trim-both_cap_alphabetic] overflow-visible!"
---
#title
:convex-text[Up and running in three moves]

#body
::landing-deploy
```bash
npx nuxi module add nuxt-convex-module
```

```bash
npm i convex
```

```bash
convex dev --start "nuxt dev"
```
::
:::
