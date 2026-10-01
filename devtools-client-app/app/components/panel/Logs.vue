<script setup lang="ts">
const state = usePanelState()

const level = ref<'all' | 'verbose' | 'log' | 'warn' | 'error'>('all')

const filtered = computed(() =>
  level.value === 'all' ? state.logs : state.logs.filter(entry => entry.level === level.value),
)

const levelColor: Record<string, string> = {
  verbose: 'op40',
  log: '',
  warn: 'text-orange',
  error: 'text-red',
}
</script>

<template>
  <div class="flex flex-col gap-3 h-full">
    <NSelectTabs
      v-model="level"
      n="xs"
      :options="[
        { label: `All (${state.logs.length})`, value: 'all' },
        { label: 'Verbose', value: 'verbose' },
        { label: 'Log', value: 'log' },
        { label: 'Warn', value: 'warn' },
        { label: 'Error', value: 'error' },
      ]"
    />

    <NPanelGrids v-if="!filtered.length">
      <span class="op50">No client log output yet.</span>
    </NPanelGrids>
    <div
      v-else
      class="font-mono text-xs flex flex-col gap-1 of-auto"
    >
      <div
        v-for="(entry, index) of filtered"
        :key="index"
        class="flex gap-2"
        :class="levelColor[entry.level]"
      >
        <span class="op40 shrink-0">{{ new Date(entry.timestamp).toLocaleTimeString() }}</span>
        <span class="uppercase op50 shrink-0 w-14">{{ entry.level }}</span>
        <span class="break-all">{{ entry.args.join(' ') }}</span>
      </div>
    </div>
  </div>
</template>
