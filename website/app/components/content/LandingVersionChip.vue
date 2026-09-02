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

// The peer ranges (Nuxt, Vue) stay in the slot — they are the page's copy. The
// Convex figure is not: it is the upstream release the port currently matches,
// so it reads off the shared baseline table the component pages use, and a
// sync bump never leaves a stale number sitting in the hero.
const convex = upstreamBaselines.convex
</script>

<template>
  <span class="concave-text inline-block font-mono text-xs font-semibold tracking-widest text-toned">
    <template v-if="version">V{{ version }} · </template><slot mdc-unwrap="p" /> · PORTS CONVEX {{ convex.version }}
  </span>
</template>
