<script setup lang="ts">
import LoadoutStation from './LoadoutStation.vue'

// Pagination: cursor pages of 3, exhausted at 9.
const PAGE = 3
const TOTAL = 9
const loaded = ref(PAGE)
const pageStatus = computed(() => loaded.value >= TOTAL ? 'Exhausted' : 'CanLoadMore')
function loadMoreDemo() {
  loaded.value = Math.min(loaded.value + PAGE, TOTAL)
}
</script>

<template>
  <LoadoutStation
    title="Cursor pagination"
    readout-label="results · status"
  >
    <template #body>
      <ProseCode>usePaginatedQuery</ProseCode> pages by cursor and
      tells you when the table is exhausted.
    </template>
    <template #code>
      <pre
        data-tokens
        class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] whitespace-pre text-highlighted"
      ><code><span class="tk-k">const</span> { results, status, loadMore } =
  <span class="tk-f">usePaginatedQuery</span>(api.messages.list, {},
    { initialNumItems: <span class="tk-n">3</span> })</code></pre>
    </template>
    <template #readout>
      <ul
        class="m-0 flex list-none flex-wrap gap-1.5 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <li
          v-for="n in loaded"
          :key="n"
          class="raised px-2 py-0.5 text-default [--raised-elev:var(--elev-0)] [--raised-radius:7px] motion-safe:animate-fade-up [animation-duration:240ms]"
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
  </LoadoutStation>
</template>
