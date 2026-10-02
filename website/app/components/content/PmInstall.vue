<script setup lang="ts">
import { pmLines } from '#shared/package-managers'

// `:pm-install{packages="convex"}` → `pnpm add convex`, or whichever manager
// the reader picked in the sidebar. `dev` installs as a devDependency.
const props = defineProps<{ packages: string, dev?: boolean }>()
const { pm } = usePackageManager()
const lines = computed(() => pmLines('pm-install', props, pm.value))
</script>

<template>
  <PmCommand :lines="lines" />
</template>
