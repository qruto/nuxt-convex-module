<script setup lang="ts">
// The live plate: the console's code on the ground, the console beside it.
// The fence arrives as the default slot from content/index.md.
import StageSplit from '../landing/StageSplit.vue'
</script>

<template>
  <StageSplit
    file="console.vue"
    note="Every browser on this page subscribes to the same rows. A flip, a drag or a press moves the instrument the instant you touch it — the optimistic update — and the commit lands a round trip later, for everyone."
  >
    <slot />
    <template #plate>
      <LandingConsole />
    </template>
  </StageSplit>
</template>
