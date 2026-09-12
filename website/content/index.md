---
seo:
  title: Use Convex backend in a Nuxt application
  description: The Convex client for Nuxt and Vue — live queries, mutations, actions, cursor pagination, file storage and SSR, auto-imported and typed against your deployment. The same client runs standalone in any Vue app.
---

:::u-page-hero
---
orientation: horizontal
class: "landing-hero-ground landing-panel"
ui:
  # Past 1280 the panel track is the plate's own width and the copy takes
  # the rest; below it the theme's halves stand (at 1024 there is no slack
  # to redistribute — see git history for the measurements).
  container: "xl:grid-cols-[minmax(0,1fr)_32rem] xl:gap-x-20"
  header: "motion-safe:animate-fade-up"
  title: "landing-billet"
  # The relief headline is a physical object on the plate: it needs a
  # margin the way a stamped part needs clearance. Two points off the
  # theme's own scale so the copy reads as the sentence under a headline,
  # not a second one; `text-pretty` so the closer's last line never
  # orphans a word.
  description: "mt-8 text-base text-pretty sm:text-lg/7 lg:mt-10"
  # The spec board sits in #body at the theme's distance from the text;
  # the footer closes up under it — a nameplate over the controls.
  footer: "mt-6 sm:mt-8"
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
::landing-hero-panel
```ts
const { data } = await useAsyncQuery(
  api.messages.list,
)
```

```ts
const send =
  useMutation(api.messages.send)

await send({ body: 'hi, realtime' })
```

```ts
const { results, loadMore } =
  usePaginatedQuery(api.messages.list,
    {}, { initialNumItems: 3 })
```

```ts
const { upload, progress } =
  useUpload(api.files.generateUploadUrl)

const id = await upload(file)
```

```ts
const analyze = useAction(api.analyze.text)

const { sha256 } = await analyze({ input })
```

```ts
import { api } from '#convex/api'
const { data } = await useAsyncQuery(api.messages.list)
const send = useMutation(api.messages.send)
```
::

#title
::hero-billet
Use :brand-convex backend\
in a :brand-nuxt application
::

#description
<!-- THE FEATURES FIRST, then what Convex is (2026-09-08). The legend is
     the reason to read on — mark, name, and every composable that IS that
     feature (LandingCapabilities.vue), lit row by row as the instrument
     panel beside it demonstrates each one. The sentence under it is one
     line: the essence of Convex and nothing else. -->
:landing-capabilities

Convex is a reactive backend — one socket for your data, functions and files, where every query stays live.

#body
<!-- The spec board — version, the peer ranges, and the upstream Convex
     release the port matches — a recessed readout directly above the calls
     to action. The peer ranges are this page's copy and travel as props;
     the version and the Convex figure the component reads for itself. -->
:landing-version-chip{nuxt="≥ 4.1" vue="≥ 3.5"}

#bottom
:landing-services
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
class: "landing-mill-knurl landing-panel landing-reveal"
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
NUXT_PUBLIC_CONVEX_URL=https://…
```

```bash
npx convex dev
```
::
:::
