<script setup lang="ts">
// Overrides Docus's DocsAsideLeftTop to put the package-manager picker at the
// top of the docs sidebar. The `subNavigationMode` branch is Docus's own,
// copied verbatim from docus@5.13.0 app/components/docs/DocsAsideLeftTop.vue
// (never rendered here — `navigation.sub` is unset); re-diff on a Docus bump.
const { subNavigationMode, sections } = useSubNavigation()
const { pm, set } = usePackageManager()
const items = PACKAGE_MANAGERS.map(name => ({ label: name, value: name, icon: `i-vscode-icons-file-type-${name}` }))
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
    <p class="mb-2 font-mono text-xs font-semibold tracking-[0.06em] text-toned convex-text">
      preferred package manager
    </p>
    <USelect
      :model-value="pm"
      :items="items"
      :icon="`i-vscode-icons-file-type-${pm}`"
      color="neutral"
      variant="soft"
      size="sm"
      class="w-full font-mono concave"
      aria-label="preferred package manager"
      @update:model-value="set($event as PackageManager)"
    />
    <USeparator
      type="dashed"
      class="my-4"
    />
  </div>
</template>
