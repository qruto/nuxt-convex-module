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
//
// Beyond the hue, every stage is its own instrument face: `face` keys a
// static engraving on the well floor (scoped CSS below) whose geometry
// restates the card's mechanism — registration marks for parity, broadcast
// rings for live, ruled lines for the served document, and so on. PLAIN VUE
// alone stays unengraved: the plain face is that card's claim. Each stage
// also carries its etched FIG. NN caption — the cards are the sheet's
// numbered figures.
interface SpecEntry {
  label: string
  stamp: string
  title: string
  body: string
  to: string
  art: Component
  band: string
  face: string
}

const ENTRIES: SpecEntry[] = [
  {
    label: 'PARITY',
    stamp: 'convex/react + nextjs',
    title: 'The API you already know',
    body: 'Ported hook-for-composable — `useQuery`, `useMutation`, `usePaginatedQuery`, `preloadQuery`. Same names, same arguments, same return shapes; Convex\'s docs translate line for line.',
    to: '/getting-started/introduction',
    art: SpecParity,
    face: 'parity',
    band: 'light-dark(var(--color-signal-500), var(--color-signal-400))',
  },
  {
    label: 'LIVE QUERIES',
    stamp: 'useQuery',
    title: 'Refs on a socket',
    body: 'Query results are refs on one shared WebSocket subscription — a mutation commits and every subscriber moves on the same tick.',
    to: '/guide/queries-and-mutations',
    art: SpecLive,
    face: 'live',
    band: 'var(--color-spectrum-gold)',
  },
  {
    label: 'SSR',
    stamp: 'useAsyncQuery',
    title: 'Server-rendered, no flash',
    body: '`useAsyncQuery` fetches on the server, ships rows in the payload, and upgrades to the live subscription on hydration.',
    to: '/guide/server-and-ssr',
    art: SpecSsr,
    face: 'ssr',
    band: 'var(--color-spectrum-cyan)',
  },
  {
    label: 'TYPED',
    stamp: '#convex/api',
    title: 'Typed against your deployment',
    body: 'Composables and components auto-import; `#convex/*` aliases resolve your generated API, with a pre-codegen fallback.',
    to: '/guide/import-aliases',
    art: SpecTyped,
    face: 'typed',
    band: 'var(--color-spectrum-azure)',
  },
  {
    label: 'OPTIMISTIC',
    stamp: '.withOptimisticUpdate',
    title: 'Commit-speed UI',
    body: '`.withOptimisticUpdate` renders the write immediately and reconciles on commit — paginated helpers like `insertAtTop` included.',
    to: '/api-reference/composables',
    art: SpecOptimistic,
    face: 'optimistic',
    band: 'var(--color-spectrum-magenta)',
  },
  {
    label: 'FILES',
    stamp: 'useUpload',
    title: 'Uploads with a progress ref',
    body: '`useUpload` and `useUploadQueue` track progress and hand back storage IDs; `useStorageUrl` resolves them.',
    to: '/guide/file-storage',
    art: SpecFiles,
    face: 'files',
    band: 'var(--color-spectrum-teal)',
  },
  {
    label: 'ADD-ONS',
    stamp: '@convex-dev/*',
    title: 'Official add-ons, auto-detected',
    body: 'Install `@convex-dev/better-auth`, `@convex-dev/polar`, `@clerk/vue`, or `@auth0/auth0-vue` and the client wires itself up — server-side components like Resend run in your Convex backend as-is.',
    to: '/guide/authentication',
    art: SpecAddons,
    face: 'addons',
    band: 'var(--color-spectrum-violet)',
  },
  {
    label: 'DEVTOOLS',
    stamp: 'nuxt devtools',
    title: 'A Convex tab in DevTools',
    body: 'Connection state, live per-query subscriptions, server logs, auth state, open-in-editor.',
    to: '/guide/devtools',
    art: SpecDevtools,
    face: 'devtools',
    band: 'var(--color-spectrum-emerald)',
  },
  {
    label: 'PLAIN VUE',
    stamp: 'nuxt-convex-module/vue',
    title: 'Nuxt optional',
    body: 'The `/vue` subpath is self-contained — the same composables in any Vue app, no Nuxt required.',
    to: '/guide/plain-vue',
    art: SpecVue,
    face: 'vue',
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
      v-for="(entry, index) in ENTRIES"
      :key="entry.label"
      class="m-0 p-0"
    >
      <NuxtLink
        :to="entry.to"
        :style="{ '--band': entry.band }"
        :data-face="entry.face"
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
        <!-- The card's working illustration — its own recessed stage wearing
             its own engraved face (see the per-face CSS below); hover floods
             the stage with a whisper of the card's band. -->
        <span
          class="well spec-stage mt-1 mb-1.5 grid min-h-24 place-items-center overflow-hidden px-3.5 py-3 [--well-radius:12px]"
          aria-hidden="true"
        >
          <component :is="entry.art" />
          <!-- The figure caption — datasheet figures are numbered. -->
          <span class="etched absolute right-2.5 bottom-1 font-mono text-[0.52rem] font-bold tracking-[0.14em] text-dimmed opacity-70">FIG. {{ String(index + 1).padStart(2, '0') }}</span>
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
.spec-stage {
  position: relative;
  /* Stacking context so the engraving (::before, z -1) slots between the
     well floor and the illustration. */
  isolation: isolate;
}
/* -- The engraved faces -------------------------------------------
   Nine stages, nine dial faces: each well floor carries a static
   engraving in the card's own band whose GEOMETRY restates the
   mechanism — the way a gauge's printed face gives each instrument
   its identity on a shared panel. Strokes stay at whisper alpha
   (edge rulers run stronger; they are tiny). Static like any
   etching — no motion to guard. */
.spec-stage::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  pointer-events: none;
}
/* PARITY — registration marks: the pressman's proof that two layers
   align perfectly. Two ⊕ in the top corners (ring + crosshair). */
.spec-card[data-face="parity"] .spec-stage::before {
  --ink: color-mix(in srgb, var(--band) 32%, transparent);
  background:
    radial-gradient(circle, transparent 2.5px, var(--ink) 2.5px 3.5px, transparent 3.5px) left 9px top 8px / 11px 11px,
    linear-gradient(var(--ink), var(--ink)) left 9px top 13px / 11px 1px,
    linear-gradient(var(--ink), var(--ink)) left 14px top 8px / 1px 11px,
    radial-gradient(circle, transparent 2.5px, var(--ink) 2.5px 3.5px, transparent 3.5px) right 9px top 8px / 11px 11px,
    linear-gradient(var(--ink), var(--ink)) right 9px top 13px / 11px 1px,
    linear-gradient(var(--ink), var(--ink)) right 14px top 8px / 1px 11px;
  background-repeat: no-repeat;
}
/* LIVE — broadcast rings off the hub's edge, fading toward the
   subscribers the packets travel to. */
.spec-card[data-face="live"] .spec-stage::before {
  background: repeating-radial-gradient(circle at 0% 50%,
    color-mix(in srgb, var(--band) 16%, transparent) 0 1px, transparent 1px 15px);
  mask-image: linear-gradient(90deg, #000 20%, transparent 82%);
}
/* SSR — the served document's ruled lines. */
.spec-card[data-face="ssr"] .spec-stage::before {
  background: repeating-linear-gradient(180deg,
    color-mix(in srgb, var(--band) 11%, transparent) 0 1px, transparent 1px 7px);
}
/* TYPED — graph paper, the editor's plane. */
.spec-card[data-face="typed"] .spec-stage::before {
  --ink: color-mix(in srgb, var(--band) 10%, transparent);
  background:
    repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 14px),
    repeating-linear-gradient(180deg, var(--ink) 0 1px, transparent 1px 14px);
}
/* OPTIMISTIC — speculative hatching, diagonal kin to the dashed
   LOCAL frame: penciled in until the commit inks it. */
.spec-card[data-face="optimistic"] .spec-stage::before {
  background: repeating-linear-gradient(45deg,
    color-mix(in srgb, var(--band) 11%, transparent) 0 1px, transparent 1px 12px);
}
/* FILES — a measuring tape along the floor under the progress ref;
   the scale runs out before the figure caption. */
.spec-card[data-face="files"] .spec-stage::before {
  --ink: color-mix(in srgb, var(--band) 30%, transparent);
  background:
    repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 7px) left bottom / 100% 5px,
    repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 28px) left bottom / 100% 9px;
  background-repeat: no-repeat;
  mask-image: linear-gradient(90deg, #000 58%, transparent 90%);
}
/* ADD-ONS — breadboard sockets: the holes things plug into. */
.spec-card[data-face="addons"] .spec-stage::before {
  background: radial-gradient(circle 1.2px,
    color-mix(in srgb, var(--band) 24%, transparent) 0 0.9px, transparent 1.2px) 0 0 / 13px 13px;
}
/* DEVTOOLS — the inspector's ruler along the top frame, major tick
   every fourth minor. */
.spec-card[data-face="devtools"] .spec-stage::before {
  --ink: color-mix(in srgb, var(--band) 30%, transparent);
  background:
    repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 6px) left top / 100% 4px,
    repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 24px) left top / 100% 7px;
  background-repeat: no-repeat;
}
/* PLAIN VUE — no engraving at all. Against eight etched faces the
   bare floor IS the card's claim: nothing required. */

/* The stage flood — painted on an overlay so the well's own gradient stays
   a single background (the recipe's contract). */
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
