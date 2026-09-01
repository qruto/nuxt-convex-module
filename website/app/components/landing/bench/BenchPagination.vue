<script setup lang="ts">
import BenchPlate from './BenchPlate.vue'

// Pagination: cursor pages of 3, exhausted at 9 — the recording pages the
// table to the end, rests, and rewinds.
const props = defineProps<{ initialDelay?: number }>()

const PAGE = 3
const TOTAL = 9
const loaded = ref(PAGE)
const pageStatus = computed(() => loaded.value >= TOTAL ? 'Exhausted' : 'CanLoadMore')

function loadMoreDemo() {
  loaded.value = Math.min(loaded.value + PAGE, TOTAL)
}

const plate = ref<{ $el: HTMLElement } | null>(null)
const root = computed(() => plate.value?.$el ?? null)
useDemoScript(root, async ({ wait }) => {
  await wait(600)
  loadMoreDemo()
  await wait(1200)
  loadMoreDemo()
  await wait(2000)
  loaded.value = PAGE
}, {
  loop: true,
  initialDelay: props.initialDelay,
  reducedMotion: () => {
    loaded.value = TOTAL
  },
})
</script>

<template>
  <BenchPlate
    ref="plate"
    label="PAGINATION"
    stamp="usePaginatedQuery"
    title="Cursor pagination"
    readout-label="results · status"
  >
    <template #body>
      <code class="font-mono text-[0.92em] text-highlighted">usePaginatedQuery</code>
      pages by cursor and tells you when the table is exhausted.
    </template>
    <template #code>
      <slot name="code" />
    </template>
    <template #readout>
      <ul
        class="m-0 flex min-h-[3.4rem] list-none content-start flex-wrap gap-1.5 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <li
          v-for="n in loaded"
          :key="n"
          class="convex-0 rounded-[7px] px-2 py-0.5 text-default motion-safe:animate-fade-up [animation-duration:240ms]"
        >
          msg_{{ String(n).padStart(3, '0') }}
        </li>
      </ul>
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :disabled="pageStatus === 'Exhausted'"
          @click="loadMoreDemo"
        >
          loadMore(3)
        </UButton>
        <span
          class="font-mono text-[0.66rem] font-semibold tracking-[0.08em]"
          :class="pageStatus === 'Exhausted' ? 'text-primary-700 dark:text-primary-300' : 'text-dimmed'"
        >{{ pageStatus }}</span>
      </div>
    </template>
  </BenchPlate>
</template>
