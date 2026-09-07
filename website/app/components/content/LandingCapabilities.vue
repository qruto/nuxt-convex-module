<script setup lang="ts">
// The capability legend — the hero's six headline features set as a part
// legend rather than as a comma list in a sentence: a mark, the name, and
// under it the composable that IS that feature, stamped in the same mono
// caps the spec cards stamp their composables in. A legend is information,
// not action, so nothing here is raised or filled: the marks and names sit
// on the plate in body ink, a full step under the billet and the primary
// key in weight, size and colour, and the stamps are cut in the way every
// small marking on this page is.
//
// The one thing that moves is the lamp. The instrument panel beside the copy
// records the same features scene by scene, and the entry it is currently
// demonstrating lights — the legend reads as the panel's own key rather than
// as a second, unrelated list of the same six words. Actions and SSR have no
// scene and never light; that is honest, the plate does not demo them.
interface Capability {
  label: string
  stamp: string
  icon: string
  /** The panel scene ids (LandingHeroPanel SCENES) that demonstrate it. */
  scenes: readonly string[]
}

const CAPABILITIES: Capability[] = [
  { label: 'Live queries', stamp: 'useQuery', icon: 'i-lucide-radio', scenes: ['QUERY', 'LIVE'] },
  { label: 'Mutations', stamp: 'useMutation', icon: 'i-lucide-pen-line', scenes: ['MUTATION'] },
  { label: 'Actions', stamp: 'useAction', icon: 'i-lucide-zap', scenes: [] },
  { label: 'Cursor pagination', stamp: 'usePaginatedQuery', icon: 'i-lucide-gallery-vertical-end', scenes: ['PAGINATION'] },
  { label: 'File storage', stamp: 'useUpload', icon: 'i-lucide-file-up', scenes: ['FILES'] },
  { label: 'SSR', stamp: 'useAsyncQuery', icon: 'i-lucide-server', scenes: [] },
]

const scene = useHeroScene()
</script>

<template>
  <!-- Three across, two rows, in the order the sentence used to run them —
       and the columns are max-content, so the legend hugs its own words
       instead of spreading six short entries across the whole copy column.
       Two across on a phone, where the copy column is the screen: `auto`
       tracks there, not 1fr — the longest name ("Cursor pagination") is
       wider than half the column and broke onto two lines in an equal
       split, which threw its stamp a line below its neighbour's. Content-
       sized tracks hand the long name its width and the free space falls
       between the two columns. -->
  <ul
    aria-label="What the module ships"
    class="capabilities m-0 grid list-none grid-cols-[auto_auto] justify-between gap-x-4 gap-y-4 p-0 sm:grid-cols-[repeat(3,max-content)] sm:justify-start sm:gap-x-12"
  >
    <li
      v-for="entry in CAPABILITIES"
      :key="entry.stamp"
      class="capability m-0 flex items-start gap-2.5 p-0"
      :data-lit="(scene && entry.scenes.includes(scene)) || undefined"
    >
      <UIcon
        :name="entry.icon"
        class="mark mt-0.5 size-4 flex-none"
        aria-hidden="true"
      />
      <span class="flex flex-col gap-0.5">
        <span class="name font-sans text-[0.95rem] leading-tight font-medium text-default">{{ entry.label }}</span>
        <span class="concave-text font-mono text-[0.6rem] leading-none font-semibold tracking-[0.12em] text-dimmed">{{ entry.stamp }}</span>
      </span>
    </li>
  </ul>
</template>

<style scoped>
/* Rest state is ink at the plate's secondary strength — the mark reads
   with the name, not ahead of it. Lit, the mark takes the signal colour
   and the glow the spec cards' band ticks carry, and the name steps up
   one rung to the headline ink. Colour only; nothing on the plate moves.
   The transition is a fade, so reduced-motion needs no guard. */
.mark {
  color: var(--ui-text-toned);
  transition: color 0.35s var(--ease-out), filter 0.35s var(--ease-out);
}
.name {
  transition: color 0.35s var(--ease-out);
}
.capability[data-lit] .mark {
  color: var(--ui-primary);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--ui-primary) 55%, transparent));
}
.capability[data-lit] .name {
  color: var(--ui-text-highlighted);
}
@media (forced-colors: active) {
  .capability[data-lit] .mark {
    filter: none;
  }
}
</style>
