<script setup lang="ts">
import { pmLines } from '#shared/package-managers'

// `:pm-x{command="nuxi@latest module add nuxt-convex-module"}` → `npx …`,
// `pnpm dlx …`, `yarn dlx …` or `bunx …`.
const props = defineProps<{ command: string }>()
const { pm } = usePackageManager()
const lines = computed(() => pmLines('pm-x', props, pm.value))
</script>

<template>
  <PmCommand :lines="lines" />
</template>
