<script setup lang="ts">
import { pmLines } from '#shared/package-managers'

// `:pm-run{scripts="dev"}` → `pnpm dev` / `npm run dev` / …; a comma-separated
// list renders one line per script.
const props = defineProps<{ scripts: string }>()
const { pm } = usePackageManager()
const lines = computed(() => pmLines('pm-run', props, pm.value))
</script>

<template>
  <PmCommand :lines="lines" />
</template>
