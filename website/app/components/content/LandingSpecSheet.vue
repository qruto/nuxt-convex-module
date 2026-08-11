<script setup lang="ts">
import type { Component } from 'vue'
import SpecAddons from '../landing/spec/SpecAddons.vue'
import SpecDevtools from '../landing/spec/SpecDevtools.vue'
import SpecFiles from '../landing/spec/SpecFiles.vue'
import SpecLive from '../landing/spec/SpecLive.vue'
import SpecOptimistic from '../landing/spec/SpecOptimistic.vue'
import SpecParity from '../landing/spec/SpecParity.vue'
import SpecSsr from '../landing/spec/SpecSsr.vue'
import SpecTyped from '../landing/spec/SpecTyped.vue'
import SpecVue from '../landing/spec/SpecVue.vue'

// The whole surface area on one plate — nine stamped cards, each with its own
// working illustration and a link to the page that proves it. Copy stays
// within the verified feature set (PARITY.md + docs). The upstream React/Next
// lineage is stamped exactly ONCE — on the PARITY card, whose card it is;
// every other stamp is this package's own path or composable. Illustrations
// are decorative (aria-hidden), ambient CSS loops guarded by motion-safe
// media, and each card's `group` hover feeds them.
interface SpecEntry {
  label: string
  stamp: string
  title: string
  body: string
  to: string
  art: Component
}

const ENTRIES: SpecEntry[] = [
  {
    label: 'PARITY',
    stamp: 'convex/react + nextjs',
    title: 'The API you already know',
    body: 'Ported hook-for-composable — `useQuery`, `useMutation`, `usePaginatedQuery`, `preloadQuery`. Same names, same arguments, same return shapes; Convex\'s docs translate line for line.',
    to: '/getting-started/introduction',
    art: SpecParity,
  },
  {
    label: 'LIVE QUERIES',
    stamp: 'useQuery',
    title: 'Refs on a socket',
    body: 'Query results are refs on one shared WebSocket subscription — a mutation commits and every subscriber moves on the same tick.',
    to: '/guide/queries-and-mutations',
    art: SpecLive,
  },
  {
    label: 'SSR',
    stamp: 'useAsyncQuery',
    title: 'Server-rendered, no flash',
    body: '`useAsyncQuery` fetches on the server, ships rows in the payload, and upgrades to the live subscription on hydration.',
    to: '/guide/server-and-ssr',
    art: SpecSsr,
  },
  {
    label: 'TYPED',
    stamp: '#convex/api',
    title: 'Typed against your deployment',
    body: 'Composables and components auto-import; `#convex/*` aliases resolve your generated API, with a pre-codegen fallback.',
    to: '/guide/import-aliases',
    art: SpecTyped,
  },
  {
    label: 'OPTIMISTIC',
    stamp: '.withOptimisticUpdate',
    title: 'Commit-speed UI',
    body: '`.withOptimisticUpdate` renders the write immediately and reconciles on commit — paginated helpers like `insertAtTop` included.',
    to: '/api-reference/composables',
    art: SpecOptimistic,
  },
  {
    label: 'FILES',
    stamp: 'useUpload',
    title: 'Uploads with a progress ref',
    body: '`useUpload` and `useUploadQueue` track progress and hand back storage IDs; `useStorageUrl` resolves them.',
    to: '/guide/file-storage',
    art: SpecFiles,
  },
  {
    label: 'ADD-ONS',
    stamp: '@convex-dev/*',
    title: 'Official add-ons, auto-detected',
    body: 'Install `@convex-dev/better-auth`, `@convex-dev/polar`, `@clerk/vue`, or `@auth0/auth0-vue` and the client wires itself up — server-side components like Resend run in your Convex backend as-is.',
    to: '/guide/authentication',
    art: SpecAddons,
  },
  {
    label: 'DEVTOOLS',
    stamp: 'nuxt devtools',
    title: 'A Convex tab in DevTools',
    body: 'Connection state, live per-query subscriptions, server logs, auth state, open-in-editor.',
    to: '/guide/devtools',
    art: SpecDevtools,
  },
  {
    label: 'PLAIN VUE',
    stamp: 'nuxt-convex-module/vue',
    title: 'Nuxt optional',
    body: 'The `/vue` subpath is self-contained — the same composables in any Vue app, no Nuxt required.',
    to: '/guide/plain-vue',
    art: SpecVue,
  },
]

// Card bodies carry `code` markers; render them as real <code> so the names
// read in mono like everywhere else on the site.
function segments(body: string) {
  return body.split('`').map((text, i) => ({ text, code: i % 2 === 1 }))
}
</script>

<template>
  <ul class="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
    <li
      v-for="entry in ENTRIES"
      :key="entry.label"
      class="m-0 p-0"
    >
      <NuxtLink
        :to="entry.to"
        class="raised group flex h-full flex-col gap-1.5 px-5 pt-4 pb-4.5 no-underline transition-[box-shadow] duration-180 ease-out [--raised-elev:var(--elev-0)] hover:[--raised-elev:var(--elev-2)] focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span class="flex items-baseline justify-between gap-3 font-mono text-[0.6rem] font-semibold tracking-[0.14em]">
          <span class="etched flex-none text-toned">{{ entry.label }}</span>
          <span class="etched min-w-0 truncate text-dimmed">{{ entry.stamp }}</span>
        </span>
        <!-- The card's working illustration — its own recessed stage. -->
        <span
          class="well mt-1 mb-1.5 grid min-h-24 place-items-center overflow-hidden px-3.5 py-3 [--well-radius:12px]"
          aria-hidden="true"
        >
          <component :is="entry.art" />
        </span>
        <span class="font-display text-[1.02rem] font-semibold text-highlighted">
          {{ entry.title }}
          <span
            aria-hidden="true"
            class="inline-block text-primary opacity-0 transition-[opacity,translate] duration-180 ease-out group-hover:translate-x-0.5 group-hover:opacity-100"
          >→</span>
        </span>
        <span class="text-[0.84rem] leading-relaxed text-toned">
          <template
            v-for="(seg, i) in segments(entry.body)"
            :key="i"
          ><code
            v-if="seg.code"
            class="font-mono text-[0.92em] text-highlighted"
          >{{ seg.text }}</code><template v-else>{{ seg.text }}</template></template>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
