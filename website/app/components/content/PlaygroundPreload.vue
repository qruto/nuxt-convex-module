<script setup lang="ts">
import type { api } from '#convex/api'
// fallow-ignore-next-line unresolved-import -- workspace subpath resolves via the stub dist at dev time; fallow can't follow it
import type { Preloaded } from 'nuxt-convex-module/vue'

// Server preload: the Nitro route runs `preloadQuery` (plus a one-shot
// `fetchQuery` count) and returns the JSON-serializable `Preloaded` payload.
// `useFetch` carries it across the server/client boundary hydration-safely.
const { data, error, refresh } = await useFetch('/api/playground/preload-messages')

// `usePreloadedQuery` needs a `Preloaded` value, never `undefined` — the
// inner component below is gated with `v-if` and receives it as a prop.
const preloaded = computed(
  () => data.value?.preloaded as Preloaded<typeof api.messages.list> | undefined,
)
</script>

<template>
  <PlaygroundDemo title="SSR preload — preloadQuery + usePreloadedQuery">
    <div
      v-if="error || !preloaded || !data"
      class="preload-offline"
    >
      <p class="preload-offline-text">
        The server route couldn't reach the Convex deployment during render.
        Start it with <code>npx convex dev</code> in <code>website/</code>, then retry.
      </p>
      <button
        class="preload-button"
        type="button"
        @click="refresh()"
      >
        Retry
      </button>
    </div>
    <PlaygroundPreloadMessages
      v-else
      :preloaded="preloaded"
      :server-count="data.count"
    />
  </PlaygroundDemo>
</template>

<style scoped>
.preload-offline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preload-offline-text {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.preload-button {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
</style>
