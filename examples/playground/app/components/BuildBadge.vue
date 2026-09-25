<script setup lang="ts">
// Which build of the module this app is running. On a pkg.pr.new preview the
// dependency range is a URL ending in the commit SHA (or `@<PR number>` when
// installed by hand), so a reviewer can confirm they are testing that build
// and not the published release.
const spec = computed(() => String(useRuntimeConfig().public.moduleSpec ?? ''))

const preview = computed(() => {
  const ref = /^https:\/\/pkg\.pr\.new\/.+@([0-9a-f]{7,40}|\d+)$/.exec(spec.value)?.[1]
  if (!ref) return null
  return { label: /^\d+$/.test(ref) ? `#${ref}` : ref.slice(0, 7), url: spec.value }
})
</script>

<template>
  <a v-if="preview" :href="preview.url" class="badge concave preview">preview {{ preview.label }}</a>
  <span v-else class="badge concave">{{ spec || 'unknown' }}</span>
</template>

<style scoped>
.badge {
  max-width: min(100%, 24rem);
  overflow: hidden;
  padding: 0.3rem 0.65rem;
  border-radius: 0.5rem;
  color: var(--text-muted);
  font: 0.75rem var(--font-mono);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview {
  color: var(--accent);
}
</style>
