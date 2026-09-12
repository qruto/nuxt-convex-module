<script setup lang="ts">
import type { Component } from 'vue'
import SpecAuth from '../landing/spec/SpecAuth.vue'
import SpecDevtools from '../landing/spec/SpecDevtools.vue'
import SpecOptimistic from '../landing/spec/SpecOptimistic.vue'
import SpecParity from '../landing/spec/SpecParity.vue'
import SpecSecurity from '../landing/spec/SpecSecurity.vue'
import SpecSsr from '../landing/spec/SpecSsr.vue'
import SpecTyped from '../landing/spec/SpecTyped.vue'
import SpecVue from '../landing/spec/SpecVue.vue'

// THE TOUR — what the module does for you, one part at a time. It replaces
// the nine-card spec sheet, which put nine animated figures and nine
// paragraphs on one screen. Here the same ground holds ONE figure at a time
// on a stage, with an index beside it: the plate turns by itself while it
// is in view (a few seconds a part), and the first touch hands it over —
// pick a part from the index and it stays picked.
//
// The index is the story in eight lines; the stage is the detail. What the
// hero legend already names (the composables) is not repeated here: these
// are the qualities of the client, not its API surface.
//
// ON A PHONE THE STAGE FOLLOWS THE PICK (2026-09-08: "on mobile view it
// needs to show the preview near the item"). The index and the stage are
// SIBLINGS in one flow rather than two columns of a grid, so the stage can
// be ordered between two entries: every entry sits at `order: i * 2` and
// the stage at `order: active * 2 + 1`, which drops it directly under
// whichever entry is lit. One instance, no duplicate artwork, and the
// desktop layout puts the same two elements back into two columns with
// explicit grid placement.
interface TourEntry {
  id: string
  label: string
  stamp: string
  title: string
  body: string
  to: string
  cta: string
  art: Component
  band: string
}

const ENTRIES: TourEntry[] = [
  {
    id: 'parity',
    label: 'parity',
    stamp: 'convex/react + nextjs',
    title: 'The API you already know',
    body: 'A port of Convex\'s own React and Next clients, hook for composable — same names, same arguments, same return shapes. Convex\'s docs translate line for line; only Vue\'s shape changes.',
    to: '/getting-started/introduction',
    cta: 'how the port works',
    art: SpecParity,
    band: 'light-dark(var(--color-signal-500), var(--color-signal-400))',
  },
  {
    id: 'typed',
    label: 'typed',
    stamp: '#convex/api',
    title: 'Typed against your deployment',
    body: 'Composables, components and server helpers auto-import. The `#convex/*` aliases resolve your generated API, and the module re-renders them the moment codegen lands.',
    to: '/getting-started/configuration#import-aliases',
    cta: 'the import aliases',
    art: SpecTyped,
    band: 'var(--color-spectrum-azure)',
  },
  {
    id: 'ssr',
    label: 'ssr',
    stamp: 'useAsyncQuery',
    title: 'Server-rendered, then live',
    body: '`useAsyncQuery` fetches on the server, ships the rows in the payload and upgrades to the live subscription on hydration — Nuxt\'s `{ data, status, error }` shape, no flash. `preloadQuery` and `fetchQuery` cover Nitro.',
    to: '/guide/server-and-ssr',
    cta: 'server and ssr',
    art: SpecSsr,
    band: 'var(--color-spectrum-cyan)',
  },
  {
    id: 'optimistic',
    label: 'optimistic',
    stamp: '.withOptimisticUpdate',
    title: 'Commit-speed UI',
    body: '`.withOptimisticUpdate` renders the write the instant you call it and reconciles on commit — the paginated helpers like `insertAtTop` come along.',
    to: '/guide/pagination#optimistic-updates-over-pages',
    cta: 'optimistic updates',
    art: SpecOptimistic,
    band: 'var(--color-spectrum-magenta)',
  },
  {
    id: 'auth',
    label: 'auth',
    stamp: '<Authenticated>',
    title: 'Auth, provider-agnostic',
    body: 'One auth state and four components to render by it. Better Auth, Clerk and Auth0 wire themselves up when their package is installed; Polar billing and Resend ride the same detection.',
    to: '/components',
    cta: 'the components',
    art: SpecAuth,
    band: 'var(--color-spectrum-violet)',
  },
  {
    id: 'security',
    label: 'security',
    stamp: 'nuxt-security',
    title: 'Hardened by default',
    body: 'Install `nuxt-security` and the CSP learns your deployment\'s origins at runtime. The auth proxy is pinned to its methods, authenticated SSR responses are never cached, and `resolveAuthRedirect` closes the open redirect on your login page.',
    to: '/getting-started/security',
    cta: 'the security guide',
    art: SpecSecurity,
    band: 'var(--color-spectrum-gold)',
  },
  {
    id: 'devtools',
    label: 'devtools',
    stamp: 'nuxt devtools',
    title: 'A Convex tab in DevTools',
    body: 'Connection state, every live subscription with its result and server logs, auth state, open-in-editor — in the DevTools you already have open.',
    to: '/guide/devtools',
    cta: 'the devtools tab',
    art: SpecDevtools,
    band: 'var(--color-spectrum-emerald)',
  },
  {
    id: 'vue',
    label: 'plain vue',
    stamp: 'nuxt-convex-module/vue',
    title: 'Nuxt optional',
    body: 'The `/vue` subpath is self-contained: the same composables in any Vue app, provided with one plugin call.',
    to: '/guide/plain-vue',
    cta: 'the plain vue guide',
    art: SpecVue,
    band: 'var(--color-spectrum-green)',
  },
]

// How long the plate holds each part before turning. Long enough for the
// figure's own loop to play once, short enough that the index visibly moves.
const HOLD_MS = 5200

const active = ref(0)
const current = computed(() => ENTRIES[active.value]!)

// THE PLATE KEEPS TURNING (2026-09-08). Picking a part does not park the
// tour on it: the hold restarts from the picked part and the plate moves
// on after it, so the index is a way to jump, never a way to stop. The
// pass starts wherever `active` is and never ends by itself; the
// pointerdown that reaches a tab stops the engine (useDemoScript's
// takeover), and the click that follows restarts it from the pick.
const root = ref<HTMLElement | null>(null)
const { state, replay } = useDemoScript(root, async ({ wait }) => {
  for (;;) {
    await wait(HOLD_MS)
    active.value = (active.value + 1) % ENTRIES.length
  }
}, { loop: false })
const turning = computed(() => state.value === 'playing')

const holdRun = ref(0)
function pick(index: number) {
  active.value = index
  holdRun.value++
  replay()
}
function onKey(event: KeyboardEvent) {
  const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    ? 1
    : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
  if (!delta) return
  event.preventDefault()
  pick((active.value + delta + ENTRIES.length) % ENTRIES.length)
  ;(root.value?.querySelector<HTMLElement>(`#tour-tab-${ENTRIES[active.value]!.id}`))?.focus()
}

function segments(body: string) {
  return body.split('`').map((text, i) => ({ text, code: i % 2 === 1 }))
}
</script>

<template>
  <div
    ref="root"
    class="tour"
  >
    <!-- THE INDEX. Eight lines, one lit. Arrow keys walk it. -->
    <button
      v-for="(entry, index) in ENTRIES"
      :id="`tour-tab-${entry.id}`"
      :key="entry.id"
      type="button"
      :aria-expanded="index === active"
      aria-controls="tour-stage"
      class="entry relative flex w-full items-center gap-3 rounded-strip px-2.5 py-2 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary"
      :class="index === active ? 'is-active' : 'hover:bg-(--ui-bg-elevated)/40'"
      :style="{ '--band': entry.band, 'order': index * 2 }"
      @click="pick(index)"
      @keydown="onKey"
    >
      <span class="stamp w-6 flex-none text-dimmed">0{{ index + 1 }}</span>
      <span class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          class="name truncate font-sans text-[0.95rem] leading-tight font-medium"
          :class="index === active ? 'text-highlighted' : 'text-default'"
        >{{ entry.title }}</span>
        <span class="stamp truncate text-dimmed">{{ entry.stamp }}</span>
      </span>
      <i
        aria-hidden="true"
        class="tick h-0.75 w-2.5 flex-none rounded-full"
      />
      <!-- The hold: a rule under the lit line that fills while the plate
           waits on this part. Only while the plate turns by itself. -->
      <i
        v-if="index === active && turning"
        :key="`hold-${active}-${holdRun}`"
        aria-hidden="true"
        class="hold absolute inset-x-2.5 bottom-0 h-px origin-left"
        :style="{ animationDuration: `${HOLD_MS}ms` }"
      />
    </button>

    <!-- THE STAGE. One plate, one figure, the caption under it — at a
         FIXED height, so turning the plate never moves the page under the
         reader's hand (2026-09-08: "the cards have different vertical
         sizes, that's why the view jumps"). The height is cut for the
         longest caption; shorter ones sit at the top of it. -->
    <figure
      id="tour-stage"
      class="part-plate sheen noise stage group m-0 flex w-full flex-col gap-4 px-6 pt-5 pb-6"
      :style="{ '--band': current.band, 'order': active * 2 + 1 }"
    >
      <header class="flex items-center justify-between gap-4 stamp">
        <span class="flex items-center gap-2">
          <i
            aria-hidden="true"
            class="tick h-0.75 w-2.5 flex-none rounded-full"
          />
          <span class="concave-text text-toned">{{ current.label }}</span>
        </span>
        <span class="concave-text min-w-0 truncate text-dimmed">{{ current.stamp }}</span>
      </header>

      <div class="part-tray figure relative grid place-items-center overflow-hidden px-6 py-8">
        <Transition
          name="fig"
          mode="out-in"
        >
          <div
            :key="current.id"
            class="art grid place-items-center"
            aria-hidden="true"
          >
            <component :is="current.art" />
          </div>
        </Transition>
        <span class="stamp absolute right-3 bottom-2 text-dimmed opacity-70">fig. 0{{ active + 1 }}</span>
      </div>

      <Transition
        name="fig"
        mode="out-in"
      >
        <figcaption
          :key="current.id"
          class="caption flex flex-col gap-2"
        >
          <span class="font-display text-[1.25rem] leading-tight font-semibold text-highlighted">{{ current.title }}</span>
          <p class="m-0 max-w-prose text-[0.92rem] leading-relaxed text-toned">
            <template
              v-for="(seg, i) in segments(current.body)"
              :key="i"
            >
              <code
                v-if="seg.code"
                class="font-mono text-[0.92em] text-highlighted"
              >{{ seg.text }}</code><template v-else>
                {{ seg.text }}
              </template>
            </template>
          </p>
          <NuxtLink
            :to="current.to"
            class="stamp mt-auto inline-flex items-center gap-1.5 self-start pt-1 text-lit no-underline hover:underline"
          >
            {{ current.cta }}
            <UIcon
              name="i-nc-arrow-right"
              class="size-3.5"
              aria-hidden="true"
            />
          </NuxtLink>
        </figcaption>
      </Transition>
    </figure>
  </div>
</template>

<style scoped>
/* ONE FLOW, TWO SHAPES. On a phone the index and the stage are one
   column and `order` drops the stage under the entry it belongs to; past
   `lg` the same two elements are placed explicitly in two columns and
   the orders stop mattering. */
.tour {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.stage {
  margin-block: 0.75rem 1.25rem;
}
@media (width >= 64rem) {
  .tour {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    column-gap: 3.5rem;
    align-items: start;
  }
  .entry {
    grid-column: 1;
  }
  .stage {
    grid-column: 2;
    grid-row: 1 / span 8;
    margin-block: 0;
  }
}
/* The band vocabulary the figures read: --band arrives on the element,
   and the soft/glow pair derives from it. */
.stage, .entry {
  --band-soft: color-mix(in srgb, var(--band) 15%, transparent);
  --band-glow: 0 0 10px color-mix(in srgb, var(--band) 45%, transparent);
}
.tick {
  background: var(--ui-border-accented);
  transition: background 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out);
}
.is-active .tick, .stage .tick {
  background: var(--band);
  box-shadow: 0 0 8px color-mix(in srgb, var(--band) 55%, transparent);
}
.is-active {
  background: var(--ui-bg-elevated);
  box-shadow: var(--elevation-0);
}
.hold {
  background: var(--band);
  animation: tour-hold linear forwards;
}
@keyframes tour-hold {
  from { scale: 0 1; }
  to { scale: 1 1; }
}
/* THE STAGE HOLDS ONE HEIGHT. The figure well and the caption are both
   cut for the longest entry, so every part is presented in the same
   frame and the index beside it never slides. */
.figure {
  block-size: 15rem;
}
.caption {
  min-block-size: 10.5rem;
}
@media (width < 40rem) {
  .figure {
    block-size: 12.5rem;
  }
  .caption {
    min-block-size: 12rem;
  }
}
/* The figure is drawn at card scale; on the stage it is read at arm's
   length, so it is zoomed rather than redrawn. */
.art {
  zoom: 1.5;
}
@media (width < 40rem) {
  .art { zoom: 1.15; }
}
.fig-enter-active, .fig-leave-active {
  transition: opacity 0.22s var(--ease-out), translate 0.22s var(--ease-out);
}
.fig-enter-from { opacity: 0; translate: 0 4px; }
.fig-leave-to { opacity: 0; translate: 0 -4px; }
@media (prefers-reduced-motion: reduce) {
  .fig-enter-active, .fig-leave-active { transition: none; }
  .hold { animation: none; }
}
</style>
