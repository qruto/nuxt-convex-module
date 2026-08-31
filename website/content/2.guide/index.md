---
title: Guide
description: The Convex composables one at a time — queries, mutations, pagination, file storage, SSR, auth state, connection state, DevTools, and plain Vue.
navigation: false
seo:
  title: Convex composables guide for Vue and Nuxt
---

Every page here documents a piece of the always-on core, with a live demo running against a real Convex deployment.

- [Queries](/guide/queries) — `useQuery` for one live subscription, `useQueries` for a set that changes at runtime.
- [Mutations & Actions](/guide/mutations-and-actions) — writes, external calls, and optimistic updates.
- [Pagination](/guide/pagination) — `usePaginatedQuery` and optimistic writes across loaded pages.
- [File Storage](/guide/file-storage) — `useUpload`, `useUploadQueue`, `useStorageUrl`.
- [Server & SSR](/guide/server-and-ssr) — one-shot Nitro calls, `useAsyncQuery`, and hydration-safe preloading.
- [Auth State](/guide/auth-state) — the provider-agnostic auth plumbing every adapter wires into.
- [Connection State](/guide/connection-state) — the live WebSocket status.
- [DevTools](/guide/devtools) — the Convex tab in Nuxt DevTools.
- [Plain Vue](/guide/plain-vue) — the same composables without Nuxt.

Auth providers and billing are opt-in and live under [Components](/components).
