<script setup lang="ts">
// The published version comes off the npm registry (cached server-side for an
// hour) rather than pinned in the markup — a hardcoded number is wrong from
// the next release onward. Unresolvable → the chip degrades to the bare spec
// text carried in the slot.
const { data: npm } = await useFetch('/api/npm-version', {
  key: 'npm-version',
  default: () => ({ version: null as string | null }),
})
const version = computed(() => npm.value?.version ?? null)
</script>

<template>
  <span class="concave-text inline-block font-mono text-xs font-semibold tracking-widest text-toned">
    <template v-if="version">V{{ version }} · </template><slot mdc-unwrap="p" />
  </span>
</template>
