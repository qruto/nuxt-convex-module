---
seo:
  title: Convex for Vue & Nuxt
  description: The Convex client for Vue and Nuxt — reactive live queries, mutations, actions, pagination, file storage and SSR, auto-imported and typed against your deployment.
---

:::u-page-hero
---
orientation: horizontal
class: "landing-hero-ground border-b border-default"
headline: "NUXT MODULE · CONVEX CLIENT LIBRARY"
ui:
  header: "motion-safe:animate-fade-up"
links:
  - label: get started
    to: /getting-started/introduction
    trailingIcon: i-lucide-arrow-right
    color: primary
  - label: github
    to: https://github.com/qruto/nuxt-convex-module
    target: _blank
    icon: i-simple-icons-github
    color: neutral
    variant: ghost
  - label: see it run
    to: "#operation"
    trailingIcon: i-lucide-arrow-down
    color: neutral
    variant: link
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

const { data } = await useAsyncQuery(
  api.messages.list,
)
const send =
  useMutation(api.messages.send)
```
::

#title
Convex for Vue & Nuxt, [machined to match upstream.]{.landing-hero-accent}

#description
The Convex client for Vue and Nuxt — reactive live queries, mutations,
actions, cursor pagination, file storage and SSR, auto-imported and typed
against your deployment.

:landing-version-chip[NUXT ≥ 4.1 · CONVEX 1.42]
:::

::u-page-section
---
id: spec
class: "landing-reveal border-b border-default scroll-mt-(--ui-header-height)"
headline: "01 · SPEC SHEET"
title: Everything the client ships
---
#description
The whole surface on one plate — every mechanism the client ships, each with
its own working illustration. Every card links to the page that proves it.

#body
:landing-spec-sheet
::

:::u-page-section
---
id: operation
class: "landing-reveal border-b border-default scroll-mt-(--ui-header-height)"
headline: "02 · LIVE OPERATION"
title: One table, every client
---
#description
The sync loop, staged: two clients, one `useQuery` subscription each, no
props between them — a write from either side lands in both panes on the
same commit. The recording drives itself and loops; touch anything and the
controls are yours. Simulated in-page with zero network — the hero above
and the [playground](/playground) run the real thing.

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
class: "landing-reveal border-b border-default scroll-mt-(--ui-header-height)"
headline: "03 · BENCH TESTS"
title: Three mechanisms on replay
---
#description
Optimistic writes, cursor pagination, file upload — looping readouts,
simulated in-page with zero network. The [playground](/playground) runs
them against a real deployment.

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
class: "landing-reveal scroll-mt-(--ui-header-height)"
headline: "04 · DEPLOYMENT"
title: In your pocket in three moves
links:
  - label: Install the kit
    to: /getting-started/installation
    trailingIcon: i-lucide-arrow-right
    color: primary
  - label: Try the live playground
    to: /playground
    color: neutral
    variant: outline
---
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
