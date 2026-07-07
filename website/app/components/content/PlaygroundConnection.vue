<script setup lang="ts">
import { api } from '#backend/api'

// `useConvexConnectionState` returns a ShallowRef<ConnectionState> that
// updates whenever any part of the connection state changes. Upstream marks
// the shape as unstable, so the grid iterates whatever fields the client
// reports instead of hardcoding them.
const connection = useConvexConnectionState()

const entries = computed(() =>
  Object.entries(connection.value).map(([key, value]) => ({
    key,
    value: format(value),
  })),
)

function format(value: unknown): string {
  if (value === null) return 'null'
  if (value instanceof Date) return value.toLocaleTimeString()
  return String(value)
}

// A deliberately slow Node action (~600ms) — fire it and watch
// `hasInflightRequests` / `inflightActions` tick while it runs.
const analyze = useAction(api.analyze.text)
const pinging = ref(false)

async function ping() {
  pinging.value = true
  try {
    await analyze({ input: 'connection state ping' })
  }
  catch {
    // Backend offline — the grid already shows it.
  }
  finally {
    pinging.value = false
  }
}
</script>

<template>
  <PlaygroundDemo title="Connection state — useConvexConnectionState">
    <div class="connection">
      <dl class="connection-grid">
        <template
          v-for="entry in entries"
          :key="entry.key"
        >
          <dt class="connection-key">
            {{ entry.key }}
          </dt>
          <dd class="connection-value">
            {{ entry.value }}
          </dd>
        </template>
      </dl>
      <button
        class="connection-button"
        type="button"
        :disabled="pinging"
        @click="ping"
      >
        {{ pinging ? 'Request in flight…' : 'Fire a slow action (~600ms)' }}
      </button>
    </div>
  </PlaygroundDemo>
</template>

<style scoped>
.connection-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 1rem;
  margin: 0 0 1rem;
  font-size: 0.8125rem;
}

.connection-key {
  font-family: var(--ui-font-mono, monospace);
  color: var(--ui-text-muted);
}

.connection-value {
  margin: 0;
  font-family: var(--ui-font-mono, monospace);
  font-weight: 500;
}

.connection-button {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.connection-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
