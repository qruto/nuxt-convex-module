<script setup lang="ts">
// The capability legend — the hero's six headline features as a part
// legend: a mark, the name, and EVERY composable that is that feature,
// stamped in the same lowercase mono every marking on the page wears
// (2026-09-08: it used to show one composable per feature; SSR alone has
// four). Set as one column of rows so the list reads top to bottom beside
// the panel instead of as three columns fighting the headline for width.
//
// The one thing that moves is the light. The instrument panel beside the
// copy records the same features scene by scene, and the row it is
// demonstrating lights — mark, name, and its stamps one after another, the
// way a readout comes on. Actions have no scene and never light; that is
// honest, the plate does not demo them.
interface Capability {
  label: string
  stamps: string[]
  icon: string
  /** The one panel scene (LandingHeroPanel SCENES) that demonstrates it. */
  scene: string
}

// ONE ROW IS LIT AT A TIME, AND EVERY ROW GETS ITS TURN (2026-09-08:
// "why do we have an orange icon for live queries and for server and SSR
// but other icons are gray? make it logical"). Two rows used to light
// together because the panel's final act carried both ids, and one row —
// Actions — never lit at all, because the recording had no scene for it.
// The panel now runs SIX scenes, one per row, in this order, so the lamp
// walks the legend from top to bottom and nothing is ever lit for a
// reason the reader cannot see on the plate beside it.
const CAPABILITIES: Capability[] = [
  { label: 'Live queries', stamps: ['useQuery', 'useQueries'], icon: 'i-lucide-radio', scene: 'QUERY' },
  { label: 'Mutations', stamps: ['useMutation', '.withOptimisticUpdate'], icon: 'i-lucide-pen-line', scene: 'MUTATION' },
  { label: 'Cursor pagination', stamps: ['usePaginatedQuery', 'insertAtTop'], icon: 'i-lucide-gallery-vertical-end', scene: 'PAGINATION' },
  { label: 'File storage', stamps: ['useUpload', 'useUploadQueue', 'useStorageUrl'], icon: 'i-lucide-file-up', scene: 'FILES' },
  { label: 'Actions', stamps: ['useAction'], icon: 'i-lucide-zap', scene: 'ACTION' },
  { label: 'Server & SSR', stamps: ['useAsyncQuery', 'preloadQuery', 'fetchQuery'], icon: 'i-lucide-server', scene: 'LIVE' },
]

const scene = useHeroScene()
</script>

<template>
  <ul
    aria-label="What the module ships"
    class="capabilities m-0 flex list-none flex-col gap-y-2 p-0"
  >
    <li
      v-for="entry in CAPABILITIES"
      :key="entry.label"
      class="capability m-0 grid items-baseline gap-x-3 gap-y-1 p-0 sm:gap-x-4"
      :data-lit="scene === entry.scene || undefined"
    >
      <UIcon
        :name="entry.icon"
        class="mark size-4 flex-none self-center"
        aria-hidden="true"
      />
      <span class="name font-sans text-[0.95rem] leading-tight font-medium text-default">{{ entry.label }}</span>
      <span class="fns flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          v-for="(stamp, i) in entry.stamps"
          :key="stamp"
          class="fn stamp text-[0.62rem] text-dimmed"
          :style="{ '--i': i }"
        >{{ stamp }}</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
/* One row per capability: mark, name, and the stamps on the same line
   while the column is wide enough to hold them; in a narrow column
   (a phone, or the halved hero below xl) the stamps drop under the name
   rather than wrapping beside it in a ragged third column. The list is
   its own size container, so the fold reads the copy column's width. */
.capabilities {
  container-type: inline-size;
}
.capability {
  grid-template-columns: 1.25rem minmax(8.5rem, max-content) minmax(0, 1fr);
}
@container (width < 36rem) {
  .capability {
    grid-template-columns: 1.25rem minmax(0, 1fr);
  }
  .fns {
    grid-column: 2;
  }
}
/* Rest state is ink at the plate's secondary strength — the mark reads
   with the name, not ahead of it. Lit, the mark takes the signal colour
   and its glow, the name steps up to headline ink, and the stamps come
   on one after another. Colour only; nothing on the plate moves. */
.mark {
  color: var(--ui-text-toned);
  transition: color 0.35s var(--ease-out), filter 0.35s var(--ease-out);
}
.name, .fn {
  transition: color 0.35s var(--ease-out);
  transition-delay: 0s;
}
.capability[data-lit] .mark {
  color: var(--ui-primary);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--ui-primary) 55%, transparent));
}
.capability[data-lit] .name {
  color: var(--ui-text-highlighted);
}
.capability[data-lit] .fn {
  color: light-dark(var(--ui-color-primary-700), var(--ui-color-primary-300));
  transition-delay: calc(var(--i) * 120ms);
}
@media (forced-colors: active) {
  .capability[data-lit] .mark {
    filter: none;
  }
}
</style>
