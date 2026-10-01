<script setup lang="ts">
import { pmLines } from '#shared/package-managers'

// `:pm-create{template="gh:…"}` → a new app from that template: `pnpm create
// nuxt@latest my-app -t …`, `npm create nuxt@latest my-app -- -t …`, …
const props = defineProps<{ template: string }>()
const { pm } = usePackageManager()
const lines = computed(() => pmLines('pm-create', props, pm.value))
</script>

<template>
  <PmCommand :lines="lines" />
</template>
