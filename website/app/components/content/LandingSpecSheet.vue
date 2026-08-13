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
//
// Every card wears a spectrum band (--color-spectrum-*, app.css): the tick by
// its label, its illustration's accents, the hover arrow and focus ring all
// key off ONE --band custom property set here. Hues are semantic, not
// decorative — hydration is cyan, types are TypeScript azure, the optimistic
// flash is magenta against the green commit, DevTools is Nuxt emerald, plain
// Vue is Vue green. PARITY alone keeps signal orange: parity IS the brand
// claim. The illustrations read var(--band) through plain CSS inheritance.
interface SpecEntry {
  label: string
  stamp: string
  title: string
  body: string
  to: string
  art: Component
  band: string
}

const ENTRIES: SpecEntry[] = [
  {
    label: 'PARITY',
    stamp: 'convex/react + nextjs',
    title: 'The API you already know',
    body: 'Ported hook-for-composable — `useQuery`, `useMutation`, `usePaginatedQuery`, `preloadQuery`. Same names, same arguments, same return shapes; Convex\'s docs translate line for line.',
    to: '/getting-started/introduction',
    art: SpecParity,
    band: 'light-dark(var(--color-signal-500), var(--color-signal-400))',
  },
  {
    label: 'LIVE QUERIES',
    stamp: 'useQuery',
    title: 'Refs on a socket',
    body: 'Query results are refs on one shared WebSocket subscription — a mutation commits and every subscriber moves on the same tick.',
    to: '/guide/queries-and-mutations',
    art: SpecLive,
    band: 'var(--color-spectrum-gold)',
  },
  {
    label: 'SSR',
    stamp: 'useAsyncQuery',
    title: 'Server-rendered, no flash',
    body: '`useAsyncQuery` fetches on the server, ships rows in the payload, and upgrades to the live subscription on hydration.',
    to: '/guide/server-and-ssr',
    art: SpecSsr,
    band: 'var(--color-spectrum-cyan)',
  },
  {
    label: 'TYPED',
    stamp: '#convex/api',
    title: 'Typed against your deployment',
    body: 'Composables and components auto-import; `#convex/*` aliases resolve your generated API, with a pre-codegen fallback.',
    to: '/guide/import-aliases',
    art: SpecTyped,
    band: 'var(--color-spectrum-azure)',
  },
  {
    label: 'OPTIMISTIC',
    stamp: '.withOptimisticUpdate',
    title: 'Commit-speed UI',
    body: '`.withOptimisticUpdate` renders the write immediately and reconciles on commit — paginated helpers like `insertAtTop` included.',
    to: '/api-reference/composables',
    art: SpecOptimistic,
    band: 'var(--color-spectrum-magenta)',
  },
  {
    label: 'FILES',
    stamp: 'useUpload',
    title: 'Uploads with a progress ref',
    body: '`useUpload` and `useUploadQueue` track progress and hand back storage IDs; `useStorageUrl` resolves them.',
    to: '/guide/file-storage',
    art: SpecFiles,
    band: 'var(--color-spectrum-teal)',
  },
  {
    label: 'ADD-ONS',
    stamp: '@convex-dev/*',
    title: 'Official add-ons, auto-detected',
    body: 'Install `@convex-dev/better-auth`, `@convex-dev/polar`, `@clerk/vue`, or `@auth0/auth0-vue` and the client wires itself up — server-side components like Resend run in your Convex backend as-is.',
    to: '/guide/authentication',
    art: SpecAddons,
    band: 'var(--color-spectrum-violet)',
  },
  {
    label: 'DEVTOOLS',
    stamp: 'nuxt devtools',
    title: 'A Convex tab in DevTools',
    body: 'Connection state, live per-query subscriptions, server logs, auth state, open-in-editor.',
    to: '/guide/devtools',
    art: SpecDevtools,
    band: 'var(--color-spectrum-emerald)',
  },
  {
    label: 'PLAIN VUE',
    stamp: 'nuxt-convex-module/vue',
    title: 'Nuxt optional',
    body: 'The `/vue` subpath is self-contained — the same composables in any Vue app, no Nuxt required.',
    to: '/guide/plain-vue',
    art: SpecVue,
    band: 'var(--color-spectrum-green)',
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
        :style="{ '--band': entry.band }"
        class="raised spec-card group flex h-full flex-col gap-1.5 px-5 pt-4 pb-4.5 no-underline transition-shadow duration-180 ease-out [--raised-elev:var(--elev-0)] hover:[--raised-elev:var(--elev-2)] focus-visible:outline-2 focus-visible:outline-(--band)"
      >
        <span class="flex items-baseline justify-between gap-3 font-mono text-[0.6rem] font-semibold tracking-[0.14em]">
          <span class="flex flex-none items-baseline gap-1.5">
            <!-- The band tick — this card's line of the spectrum, echoing the
                 section headline's signal tick at card scale. -->
            <i
              aria-hidden="true"
              class="band-tick h-0.75 w-2.5 flex-none self-center rounded-full"
            />
            <span class="etched text-toned">{{ entry.label }}</span>
          </span>
          <span class="etched min-w-0 truncate text-dimmed">{{ entry.stamp }}</span>
        </span>
        <!-- The card's working illustration — its own recessed stage; hover
             floods the stage with a whisper of the card's band. -->
        <span
          class="well spec-stage mt-1 mb-1.5 grid min-h-24 place-items-center overflow-hidden px-3.5 py-3 [--well-radius:12px]"
          aria-hidden="true"
        >
          <component :is="entry.art" />
        </span>
        <span class="font-display text-[1.02rem] font-semibold text-highlighted">
          {{ entry.title }}
          <span
            aria-hidden="true"
            class="spec-arrow inline-block opacity-0 transition-[opacity,translate] duration-180 ease-out group-hover:translate-x-0.5 group-hover:opacity-100"
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

<style scoped>
/* One seam per card: --band arrives on the element via the style binding;
   everything band-tinted below and inside the art components derives from
   it with color-mix. The soft/glow pair is the shared vocabulary the nine
   illustrations reuse (they read the inherited custom properties). */
.spec-card {
  --band-soft: color-mix(in srgb, var(--band) 15%, transparent);
  --band-glow: 0 0 10px color-mix(in srgb, var(--band) 45%, transparent);
}
.band-tick {
  background: var(--band);
  box-shadow: 0 0 8px color-mix(in srgb, var(--band) 55%, transparent);
}
.spec-arrow {
  color: var(--band);
}
/* The stage flood — painted on an overlay so the well's own gradient stays
   a single background (the recipe's contract). */
.spec-stage {
  position: relative;
}
.spec-stage::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(90% 130% at 50% 0%,
    color-mix(in srgb, var(--band) 10%, transparent), transparent 72%);
  transition: opacity 0.25s var(--ease-out);
}
.spec-card:hover .spec-stage::after,
.spec-card:focus-visible .spec-stage::after {
  opacity: 1;
}
</style>
