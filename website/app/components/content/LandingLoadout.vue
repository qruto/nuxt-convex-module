<script setup lang="ts">
// The loadout, demonstrated instead of described: a station rail covering
// the port's whole surface — each station is its own component with the
// real API and a small working readout, simulated in-page (the homepage
// has no deployment); the playground runs the real thing. Stamps are the
// upstream origin of each station, same as PARITY.md.
import StationQueries from '../landing/loadout/StationQueries.vue'
import StationPagination from '../landing/loadout/StationPagination.vue'
import StationSsr from '../landing/loadout/StationSsr.vue'
import StationFiles from '../landing/loadout/StationFiles.vue'
import StationAuth from '../landing/loadout/StationAuth.vue'
import StationBilling from '../landing/loadout/StationBilling.vue'
import StationDevtools from '../landing/loadout/StationDevtools.vue'

const stations = [
  { id: 'queries', label: 'Live queries', stamp: 'convex/react', component: markRaw(StationQueries) },
  { id: 'pagination', label: 'Pagination', stamp: 'convex/react', component: markRaw(StationPagination) },
  { id: 'ssr', label: 'SSR & preload', stamp: 'convex/nextjs', component: markRaw(StationSsr) },
  { id: 'files', label: 'File storage', stamp: 'convex/react', component: markRaw(StationFiles) },
  { id: 'auth', label: 'Auth', stamp: '@convex-dev/better-auth', component: markRaw(StationAuth) },
  { id: 'billing', label: 'Billing', stamp: '@convex-dev/polar', component: markRaw(StationBilling) },
  { id: 'devtools', label: 'DevTools', stamp: 'nuxt devtools', component: markRaw(StationDevtools) },
] as const

type StationId = typeof stations[number]['id']
const active = ref<StationId>('queries')
const activeStation = computed(() => stations.find(s => s.id === active.value) ?? stations[0])

const tabEls: HTMLButtonElement[] = []
function setTabEl(el: unknown, i: number) {
  if (el) tabEls[i] = el as HTMLButtonElement
}

function activate(i: number) {
  const station = stations[i]
  if (!station) return
  // Same-document View Transition: the active-tab plate morphs down the
  // rail and the panel cross-fades. Feature-detected; a reduced-motion
  // preference or an in-flight transition falls back to the plain swap.
  if (
    typeof document !== 'undefined'
    && 'startViewTransition' in document
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.startViewTransition(async () => {
      active.value = station.id
      await nextTick()
    })
  }
  else {
    active.value = station.id
  }
}

function onTabKeydown(event: KeyboardEvent, i: number) {
  const last = stations.length - 1
  let next: number | null = null
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      next = i === last ? 0 : i + 1
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      next = i === 0 ? last : i - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
  }
  if (next === null) return
  event.preventDefault()
  activate(next)
  tabEls[next]?.focus()
}
</script>

<template>
  <!-- Console layout — rail + panel. -->
  <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
    <div
      class="flex gap-1.5 max-lg:overflow-x-auto max-lg:pb-1.5 max-lg:[scrollbar-width:thin] lg:flex-col"
      role="tablist"
      aria-label="Capabilities"
      aria-orientation="vertical"
    >
      <!-- A station tab: flat on the ground at rest, seated (a raised
           plate) when active. The seated plate morphs between rail slots
           via the view-transition-name. -->
      <button
        v-for="(s, i) in stations"
        :id="`kit-tab-${s.id}`"
        :key="s.id"
        :ref="el => setTabEl(el, i)"
        role="tab"
        :aria-selected="active === s.id"
        :aria-controls="`kit-panel-${s.id}`"
        :tabindex="active === s.id ? 0 : -1"
        class="group flex cursor-pointer flex-col items-start gap-1 rounded-lg border border-transparent px-3.5 py-2.5 text-left transition-[box-shadow,background,color] duration-180 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-lg:flex-none"
        :class="active === s.id
          ? 'plate [--plate-radius:16px] [view-transition-name:kit-active-tab]'
          : 'hover:bg-muted'"
        @click="activate(i)"
        @keydown="onTabKeydown($event, i)"
      >
        <span class="tab-label font-display text-[0.92rem] font-semibold text-toned transition-colors duration-180 group-hover:text-highlighted">{{ s.label }}</span>
        <span class="tab-stamp font-mono text-[0.6rem] font-semibold tracking-[0.08em] text-dimmed">{{ s.stamp }}</span>
      </button>
    </div>

    <!-- The station panel — one raised plate; remounts (and settles in) on
         every station switch via the :key. -->
    <div
      :id="`kit-panel-${active}`"
      :key="active"
      class="plate sheen min-h-[21rem] px-6 pt-5 pb-6 motion-safe:animate-fade-up [animation-duration:260ms] [view-transition-name:kit-panel] max-lg:min-h-0"
      role="tabpanel"
      :aria-labelledby="`kit-tab-${active}`"
    >
      <component :is="activeStation.component" />
    </div>
  </div>
</template>

<style scoped>
/* The active tab IS a plate — the `plate` utility raises the --depth
   flag, and the labels react to the surface they sit on via a container
   style query instead of a duplicated state attribute. Tailwind has no
   style-query variant, so this one block stays CSS. */
@container style(--depth: plate) {
  .tab-label {
    color: var(--ui-text-highlighted);
  }

  .tab-stamp {
    color: light-dark(var(--ui-color-primary-700), var(--ui-color-primary-300));
  }
}
</style>
