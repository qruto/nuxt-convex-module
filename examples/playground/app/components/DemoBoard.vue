<script setup lang="ts">
import { api } from '#convex/api'

// The live state of this page's Convex client: whether the WebSocket is open,
// and how many mutations and actions are still waiting for the server.
const connection = useConvexConnectionState()

const reset = useMutation(api.playground.reset)
const { pending, error, run } = useCall()
</script>

<template>
  <div class="toolbar">
    <p class="status concave" role="status">
      <span class="dot" :class="{ live: connection.isWebSocketConnected }" />
      {{ connection.isWebSocketConnected ? 'live' : 'connecting' }}
      <span class="detail">
        · {{ connection.inflightMutations }} mutations · {{ connection.inflightActions }} actions in flight
      </span>
      <code class="detail">useConvexConnectionState()</code>
    </p>
    <button type="button" class="button" :disabled="pending" @click="run(() => reset({}))">
      Reset data
    </button>
  </div>
  <p v-if="error" class="error" role="alert">{{ error }}</p>

  <div class="grid">
    <DemoLiveQueries />
    <DemoMutations />
    <DemoPagination />
    <DemoFileStorage />
    <DemoActions />
    <DemoServer />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.5rem;
  align-items: center;
  min-height: 2.25rem;
  padding: 0.4rem 0.9rem;
  border-radius: 0.6rem;
  color: var(--text-strong);
  font: 0.8rem var(--font-mono);
}

.detail {
  color: var(--text-muted);
}

code.detail {
  margin-left: 0.5rem;
  color: var(--text-dimmed);
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--text-dimmed);
}

.dot.live {
  background: var(--success);
  box-shadow: 0 0 8px color-mix(in srgb, var(--success) 60%, transparent);
}

.error {
  margin-bottom: 1rem;
  color: var(--error);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr));
  gap: 1rem;
}
</style>
