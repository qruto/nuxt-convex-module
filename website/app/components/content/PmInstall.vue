<script setup lang="ts">
// `:pm-install{packages="convex"}` → `pnpm add convex`, or whichever manager
// the reader picked in the sidebar. `dev` installs as a devDependency.
const props = defineProps<{ packages: string, dev?: boolean }>()
const { commands } = usePackageManager()
const lines = computed(() => [`${props.dev ? commands.value.addDev : commands.value.add} ${props.packages}`])
</script>

<template>
  <PmCommand :lines="lines" />
</template>
