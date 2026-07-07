<script setup lang="ts">
const state = usePanelState()

function formatTime(timestamp: number | null): string {
  if (!timestamp) return 'never'
  return new Date(timestamp).toLocaleTimeString()
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? 'undefined'
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <NPanelGrids v-if="!state.queries.length">
      <span class="op50">No active query subscriptions.</span>
    </NPanelGrids>

    <NSectionBlock
      v-for="query of state.queries"
      :key="query.token"
      :text="query.udfPath"
      :padding="false"
      :open="false"
      icon="carbon-data-share"
    >
      <template #description>
        <span class="font-mono text-xs op65">{{ JSON.stringify(query.args) }}</span>
      </template>
      <template #actions>
        <NBadge
          v-if="query.paginated"
          n="blue"
        >
          paginated
        </NBadge>
        <NBadge
          v-if="query.errorMessage"
          n="red"
        >
          error
        </NBadge>
        <span class="op50 text-xs whitespace-nowrap">
          {{ query.listenerCount }} 👂 · {{ query.updates }} updates · {{ formatTime(query.lastUpdatedAt) }}
        </span>
        <NButton
          n="xs"
          icon="carbon-launch"
          title="Open source file in editor"
          @click.stop="openFunctionInEditor(query.udfPath)"
        >
          source
        </NButton>
      </template>

      <div class="flex flex-col gap-3 px4 pb4">
        <NTip
          v-if="query.errorMessage"
          n="red"
          icon="carbon-warning"
        >
          {{ query.errorMessage }}
        </NTip>
        <template v-else>
          <div class="op50 text-xs">
            Result
          </div>
          <NCodeBlock
            :code="query.result === undefined ? '// loading…' : pretty(query.result)"
            lang="json"
            :lines="false"
            class="max-h-80 of-auto"
          />
        </template>

        <template v-if="query.logs?.length">
          <div class="op50 text-xs">
            Server logs
          </div>
          <div class="font-mono text-xs bg-active rounded p2 flex flex-col gap-1">
            <div
              v-for="(line, index) of query.logs"
              :key="index"
            >
              {{ line }}
            </div>
          </div>
        </template>
      </div>
    </NSectionBlock>
  </div>
</template>
