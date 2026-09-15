<script setup lang="ts">
// The repository's CHANGELOG.md, rendered on the site. The file is read at
// build time; the footer's Changelog link points here.
import changelog from '../../../CHANGELOG.md?raw'
// `<MDC>` resolves tags by global name; the site's prose overrides under
// components/content are only mapped for content pages, so pass ours.
import ProseA from '../components/content/ProseA.vue'

// Drop the file's own H1 — the page header carries the title.
const body = changelog.replace(/^# Changelog\s*/, '')

useSeoMeta({
  title: 'Changelog',
  description: 'Every release of nuxt-convex-module and what changed in it.',
})
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        title="Changelog"
        headline="Releases"
        description="Every release and what changed in it. Versions follow semver; see the Versioning section of the introduction for what that promises."
      />
      <UPageBody>
        <MDC
          :value="body"
          :components="{ a: ProseA }"
          class="prose"
        />
      </UPageBody>
    </UPage>
  </UContainer>
</template>
