<script setup lang="ts">
// `:pm-run{scripts="dev"}` → `pnpm dev` / `npm run dev` / …; a comma-separated
// list renders one line per script.
const props = defineProps<{ scripts: string }>()
const { commands } = usePackageManager()
const lines = computed(() => props.scripts.split(',').map(s => commands.value.run(s.trim())))
</script>

<template>
  <PmCommand :lines="lines" />
</template>
