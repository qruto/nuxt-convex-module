<script setup lang="ts">
// `:pm-create{template="gh:…"}` → a new app from that template: `pnpm create
// nuxt@latest my-app -t …`, `npm create nuxt@latest my-app -- -t …`, …
const props = defineProps<{ template: string }>()
const { commands } = usePackageManager()
const lines = computed(() => [commands.value.create(props.template)])
</script>

<template>
  <PmCommand :lines="lines" />
</template>
