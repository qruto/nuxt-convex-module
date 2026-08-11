<script setup lang="ts">
// Three mechanisms on replay — always visible, no tabs to work through.
// Each plate loops a simulated recording (zero network writes; the
// playground runs the real thing), staggered so the bench doesn't pulse
// in lockstep, and every recording stops for good the moment the visitor
// touches its plate. Snippets ride in from content/index.md as three
// fenced code blocks in the default slot — order is the contract:
// optimistic, pagination, upload (named slots can't reach a component
// nested inside a section's slot, see codeSlotParts).
import BenchOptimistic from '../landing/bench/BenchOptimistic.vue'
import BenchPagination from '../landing/bench/BenchPagination.vue'
import BenchUpload from '../landing/bench/BenchUpload.vue'

const parts = codeSlotParts(useSlots(), 3)
</script>

<template>
  <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
    <BenchOptimistic :initial-delay="0">
      <template #code>
        <component :is="parts[0]" />
      </template>
    </BenchOptimistic>
    <BenchPagination :initial-delay="800">
      <template #code>
        <component :is="parts[1]" />
      </template>
    </BenchPagination>
    <BenchUpload :initial-delay="1600">
      <template #code>
        <component :is="parts[2]" />
      </template>
    </BenchUpload>
  </div>
</template>
