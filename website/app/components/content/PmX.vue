<script setup lang="ts">
// `:pm-x{command="nuxi@latest module add nuxt-convex-module"}` → `npx …`,
// `pnpm dlx …`, `yarn dlx …` or `bunx …`.
const props = defineProps<{ command: string }>()
const { commands } = usePackageManager()
const lines = computed(() => [`${commands.value.dlx} ${props.command}`])
</script>

<template>
  <PmCommand :lines="lines" />
</template>
