<script setup lang="ts">
const state = usePanelState()

const status = computed(() => state.connection.status)
const conn = computed(() => state.connection.state)

const statusBadge = computed(() => {
  if (status.value === 'closed') return { n: 'red', text: 'Closed' }
  if (status.value === 'idle') return { n: 'gray', text: 'Idle — no WebSocket yet' }
  return conn.value?.isWebSocketConnected
    ? { n: 'green', text: 'Connected' }
    : { n: 'orange', text: 'Disconnected' }
})

const dashboardUrl = computed(() => {
  const url = state.info?.url
  if (!url) return null
  try {
    const deployment = new URL(url).hostname.split('.')[0]
    return deployment ? `https://dashboard.convex.dev/d/${deployment}` : null
  }
  catch {
    return null
  }
})

const oldestInflight = computed(() => {
  const time = conn.value?.timeOfOldestInflightRequest
  return time ? `${Math.round((Date.now() - time) / 1000)}s ago` : '—'
})

const stats = computed(() => [
  { label: 'Ever connected', value: conn.value ? String(conn.value.hasEverConnected) : '—' },
  { label: 'Connections', value: conn.value ? String(conn.value.connectionCount) : '—' },
  { label: 'Connection retries', value: conn.value ? String(conn.value.connectionRetries) : '—' },
  { label: 'In-flight mutations', value: conn.value ? String(conn.value.inflightMutations) : '—' },
  { label: 'In-flight actions', value: conn.value ? String(conn.value.inflightActions) : '—' },
  { label: 'Oldest in-flight request', value: oldestInflight.value },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <NCard class="p4 flex items-center gap-3">
      <NBadge :n="statusBadge.n">
        {{ statusBadge.text }}
      </NBadge>
      <span
        v-if="state.info?.url"
        class="op65 font-mono text-xs"
      >{{ state.info.url }}</span>
      <span
        v-else
        class="op65"
      >No deployment URL configured</span>
      <NLink
        v-if="dashboardUrl"
        :href="dashboardUrl"
        target="_blank"
        class="ml-auto flex items-center gap-1"
      >
        <NIcon icon="carbon-launch" /> Convex dashboard
      </NLink>
    </NCard>

    <NCard class="p4">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="stat of stats"
          :key="stat.label"
        >
          <div class="op50 text-xs">
            {{ stat.label }}
          </div>
          <div class="font-mono">
            {{ stat.value }}
          </div>
        </div>
      </div>
    </NCard>

    <NCard
      v-if="state.info"
      class="p4"
    >
      <div class="op50 text-xs mb2">
        Module
      </div>
      <div class="flex flex-col gap-1 font-mono text-xs">
        <div>functions dir: {{ state.info.functionsDir }}/</div>
        <div v-if="state.info.siteUrl">
          site url: {{ state.info.siteUrl }}
        </div>
        <div>
          integrations:
          {{ Object.entries(state.info.integrations).filter(([, on]) => on).map(([name]) => name).join(', ') || 'none' }}
        </div>
      </div>
    </NCard>
  </div>
</template>
