---
seo:
  title: Use Convex backend in a Nuxt application
  description: One install wires Convex into Nuxt — live queries, mutations, actions, cursor pagination, file storage and SSR, auto-imported and typed against your deployment. The same client runs standalone in any Vue app.
---

:::u-page-hero
---
orientation: horizontal
class: "landing-hero-ground border-b border-default"
headline: "NUXT MODULE · CONVEX INTEGRATION"
ui:
  header: "motion-safe:animate-fade-up"
  title: "landing-billet"
links:
  - label: get started
    to: /getting-started/introduction
    # The destination is the docs, not a next step in a flow — an open book
    # names it, and a noun LEADS the way the github mark does (arrows stay
    # trailing, where they mean direction).
    icon: i-nc-book-open
    color: primary
    ui:
      # size xl ships a 24px icon — oversized next to its 16px label.
      leadingIcon: size-4.5
  - label: github
    to: https://github.com/qruto/nuxt-convex-module
    target: _blank
    icon: i-simple-icons-github
    color: neutral
    variant: ghost
  - label: see it run
    to: "#operation"
    trailingIcon: i-nc-arrow-down
    color: neutral
    variant: link
    ui:
      trailingIcon: size-4
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
<!-- Three beats, two emphasis spans. The old build bolded all six capability
     names, which is what made the block read as noise: a comma list is
     already a list, and bolding every item in it emphasises nothing. Bold
     now carries the CLAIM (one span, the lead), `.text-primary` the one
     thing that is actually the module's argument, and the closer runs
     plain — it is an aside, not a third pitch. -->
**One install wires Convex into Nuxt.**

Live queries, mutations, actions, cursor pagination, file storage and SSR —
all [auto-imported and typed]{.text-primary} against your deployment.

The same client runs standalone in any Vue app.

:landing-version-chip[NUXT ≥ 4.1 · VUE ≥ 3.5]
:::

:landing-services

::u-page-section
---
id: spec
class: "landing-mill-grid landing-reveal border-b border-default scroll-mt-(--ui-header-height)"
headline: "01 · SPEC SHEET"
---
#title
:concave-text[Everything the module ships]

#description
The whole surface on one plate — nine numbered figures, each **color-banded**
and working live on its own **engraved stage**. Every card links to the page
that proves it.

#body
:landing-spec-sheet
::

:::u-page-section
---
id: operation
class: "landing-mill-rings landing-reveal border-b border-default scroll-mt-(--ui-header-height)"
headline: "02 · LIVE OPERATION"
---
#title
:concave-text[One table, every client]

#description
The sync loop, staged: two clients, one `useQuery` subscription each, **no
props between them** — a write from either side lands in **both panes on the
same commit**. The recording drives itself and loops; touch anything and the
controls are yours. Simulated in-page with zero network — the hero above
and the [live demos in the guide](/guide/queries) run the real thing.

#body
::landing-operation
```ts
const { data } =
  useQuery(api.messages.list)
```

```ts
const send =
  useMutation(api.messages.send)

await send({
  author: 'client-a',
  body: 'hello from A',
})
```

```ts
await send({
  author: 'client-b',
  body: 'hello back from B',
})
```
::
:::

:::u-page-section
---
id: bench
class: "landing-mill-hatch landing-reveal border-b border-default scroll-mt-(--ui-header-height)"
headline: "03 · BENCH TESTS"
---
#title
:concave-text[Three mechanisms on replay]

#description
**Optimistic writes**, **cursor pagination**, **file upload** — looping
readouts, simulated in-page with zero network. The guide's
[live demos](/guide/pagination) run them against a real deployment.

#body
::landing-bench
```ts
const send = useMutation(api.messages.send)
  .withOptimisticUpdate((store, { body }) => {
    // render the write before the commit
  })
```

```ts
const { results, status, loadMore } =
  usePaginatedQuery(api.messages.list, {},
    { initialNumItems: 3 })
```

```ts
const { upload, progress } =
  useUpload(api.files.generateUploadUrl)
const storageId = await upload(file)
```
::
:::

:::u-page-section
---
id: deploy
class: "landing-mill-knurl landing-reveal scroll-mt-(--ui-header-height)"
headline: "04 · DEPLOYMENT"
links:
  - label: Install the kit
    to: /getting-started/installation
    trailingIcon: i-nc-arrow-right
    color: primary
    ui:
      # size xl ships a 24px icon — oversized next to its 16px label.
      trailingIcon: size-4.5
  - label: See it running live
    to: /guide/queries
    color: neutral
    variant: outline
---
#title
:convex-text[In your pocket in three moves]

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
