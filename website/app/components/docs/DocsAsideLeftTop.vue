<script setup lang="ts">
// Overrides Docus's DocsAsideLeftTop to put the package-manager picker at the
// top of the docs sidebar. The picker itself is DocsPackageChooser, which the
// header's mobile menu mounts too — the aside is hidden below `lg`. The
// `subNavigationMode` branch is Docus's own, copied verbatim from docus@5.13.0
// app/components/docs/DocsAsideLeftTop.vue (never rendered here —
// `navigation.sub` is unset); re-diff on a Docus bump.
const { subNavigationMode, sections } = useSubNavigation()
</script>

<template>
  <div
    v-if="subNavigationMode === 'aside'"
    class="mb-2"
  >
    <UPageAnchors :links="sections" />
    <USeparator
      type="dashed"
      class="my-4"
    />
  </div>

  <div class="mb-2">
    <DocsPackageChooser />
    <USeparator
      type="dashed"
      class="my-4"
    />
  </div>
</template>
