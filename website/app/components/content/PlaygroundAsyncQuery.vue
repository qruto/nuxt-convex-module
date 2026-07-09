<script setup lang="ts">
import { api } from '#backend/api'

// One composable end to end: fetched on the server during SSR, hydrated
// through the Nuxt payload, then upgraded to a live WebSocket subscription —
// Nuxt's familiar { data, status, error, refresh } shape.
const { data: messages, status, error, refresh } = useAsyncQuery(api.messages.list, {})
</script>

<template>
  <PlaygroundDemo title="useAsyncQuery — SSR data, then live">
    <div
      v-if="error"
      class="async-offline"
    >
      <p class="async-offline-text">
        The SSR fetch couldn't reach the Convex backend.
        Start it with <code>npx convex dev</code> in <code>website/</code>, then retry.
      </p>
      <button
        class="async-button"
        type="button"
        @click="refresh()"
      >
        Retry
      </button>
    </div>
    <template v-else>
      <p class="async-status">
        status: <code>{{ status }}</code> — rendered on the server, live afterwards
        (post a message in the chat demo and it appears here instantly).
      </p>
      <ul class="async-list">
        <li
          v-for="message in messages ?? []"
          :key="message._id"
        >
          <strong>{{ message.author }}</strong>: {{ message.body }}
        </li>
      </ul>
    </template>
  </PlaygroundDemo>
</template>

<style scoped>
.async-offline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.async-offline-text {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.async-button {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.async-status {
  margin: 0 0 0.5rem;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.async-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
