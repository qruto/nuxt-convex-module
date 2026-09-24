<script setup lang="ts">
// Which build of the module this app is actually running. On a pkg.pr.new
// preview the dependency range is a URL ending in the commit SHA, so a reviewer
// who opened this from a pull request comment can confirm at a glance that they
// are exercising that commit and not the published release.
const spec = computed(() => String(useRuntimeConfig().public.moduleSpec ?? ''))

const preview = computed(() => {
  const sha = /@([0-9a-f]{7,40})$/.exec(spec.value)?.[1]
  return sha && spec.value.startsWith('http') ? { sha: sha.slice(0, 7), url: spec.value } : null
})
</script>

<template>
  <p class="build">
    <code>nuxt-convex-module</code>
    <a v-if="preview" :href="preview.url" class="tag preview">preview {{ preview.sha }}</a>
    <span v-else class="tag">{{ spec || 'unknown' }}</span>
  </p>
</template>

<style scoped>
.build {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  color: var(--muted);
  font-size: 0.8rem;
}

.tag {
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--raised);
  color: inherit;
  text-decoration: none;
}

.preview {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  color: var(--accent);
}
</style>
