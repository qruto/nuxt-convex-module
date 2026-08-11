<script setup lang="ts">
import { api } from '#convex/api'

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
    // Deployment offline — the grid already shows it.
  }
  finally {
    pinging.value = false
  }
}
</script>

<template>
  <PlaygroundDemo title="Connection state — useConvexConnectionState">
    <dl class="m-0 mb-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 font-mono text-xs">
      <template
        v-for="entry in entries"
        :key="entry.key"
      >
        <dt class="text-muted">
          {{ entry.key }}
        </dt>
        <dd class="m-0 font-medium text-default tabular-nums">
          {{ entry.value }}
        </dd>
      </template>
    </dl>
    <UButton
      type="button"
      color="neutral"
      variant="outline"
      :loading="pinging"
      @click="ping"
    >
      {{ pinging ? 'Request in flight…' : 'Fire a slow action (~600ms)' }}
    </UButton>
  </PlaygroundDemo>
</template>
