<script setup lang="ts">
// Which build of the module this app is running. On a pkg.pr.new preview the
// dependency range is a URL ending in the commit SHA, so a reviewer who opened
// this from a pull request comment can confirm they are testing that commit
// and not the published release.
const spec = computed(() => String(useRuntimeConfig().public.moduleSpec ?? ''))

const preview = computed(() => {
  const sha = /@([0-9a-f]{7,40})$/.exec(spec.value)?.[1]
  return sha && spec.value.startsWith('http') ? { sha: sha.slice(0, 7), url: spec.value } : null
})
</script>

<template>
  <a v-if="preview" :href="preview.url" class="badge concave preview">preview {{ preview.sha }}</a>
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
