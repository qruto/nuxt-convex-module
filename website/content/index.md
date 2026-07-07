---
seo:
  title: Convex for Vue & Nuxt
  description: A faithful Vue/Nuxt port of Convex's official React/Next integration — reactive live queries, mutations, actions, pagination, file storage, and SSR — with opt-in Better Auth and Polar.
---

::u-page-hero
---
orientation: horizontal
---
#title
Convex for Vue & Nuxt

#description
A faithful Vue/Nuxt port of Convex's official React/Next integration — reactive live queries, mutations, actions, pagination, file storage, and SSR. Better Auth and Polar light up automatically when installed.

#links
  :::u-button
  ---
  size: xl
  to: /getting-started/introduction
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  variant: subtle
  size: xl
  to: https://github.com/qruto/nuxt-convex-kit
  target: _blank
  icon: i-simple-icons-github
  ---
  Star on GitHub
  :::

#default
```vue [app.vue]
<script setup lang="ts">
import { api } from '#backend/api'

const messages = useQuery(api.messages.list, {})
const send = useMutation(api.messages.send)
</script>

<template>
  <ul>
    <li v-for="m in messages" :key="m._id">{{ m.body }}</li>
  </ul>
  <button @click="send({ body: 'hi' })">Send</button>
</template>
```
::

::u-page-section
#title
Everything from `convex/react`, the Vue way

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  ---
  #title
  Reactive live queries

  #description
  `useQuery`, `useQueries`, `useMutation`, `useAction`, cursor `usePaginatedQuery`. Queries are VueUse-shaped — `MaybeRefOrGetter` args, `ComputedRef`/`ShallowRef` results; mutations and actions return plain async functions.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-server
  ---
  #title
  SSR & preloading

  #description
  `fetchQuery`, `preloadQuery`, and `usePreloadedQuery` for hydration-safe server rendering — a port of `convex/nextjs`.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  ---
  #title
  Auth, opt-in

  #description
  Install `@convex-dev/better-auth` and `useAuth`, the `/api/auth` proxy, route middleware, and `<AuthBoundary>` wire themselves up — no extra modules.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-credit-card
  ---
  #title
  Billing, opt-in

  #description
  Install `@convex-dev/polar` and `<CheckoutLink>` / `<CustomerPortalLink>` register automatically.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-upload
  ---
  #title
  File storage

  #description
  `useUpload`, `useUploadQueue`, and `useStorageUrl` for Convex file storage.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-git-compare
  ---
  #title
  Diffable with upstream

  #description
  Each file mirrors its `convex/react`, `convex/nextjs`, or `@convex-dev/*` origin, so tracking upstream releases stays mechanical.
  :::
::
