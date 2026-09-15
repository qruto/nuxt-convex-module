<script setup lang="ts">
// The rail's first cell: the lamp with its word. Every status rail on the
// landing opens with one (chrome.css's .rail-cell / .lamp), reading the same
// { lamp, tone, label } its owner computes from connection state.
defineProps<{
  state: { lamp: string, tone: string, label: string }
}>()
</script>

<template>
  <span class="rail-cell">
    <i
      aria-hidden="true"
      class="lamp"
      :class="state.lamp"
    />
    <span
      class="concave-text"
      :class="state.tone"
    >{{ state.label }}</span>
  </span>
</template>
