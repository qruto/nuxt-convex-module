<script setup lang="ts">
import type { api } from '#convex/api'
// fallow-ignore-next-line unresolved-import -- workspace subpath resolves via the stub dist at dev time; fallow can't follow it
import type { Preloaded } from 'nuxt-convex-module/client'

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
      class="flex flex-wrap items-center gap-3"
    >
      <p class="m-0 text-sm text-muted">
        The server route couldn't reach the Convex deployment during render.
        Start it with <ProseCode>npx convex dev</ProseCode> in <ProseCode>website/</ProseCode>, then retry.
      </p>
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        @click="refresh()"
      >
        Retry
      </UButton>
    </div>
    <PlaygroundPreloadMessages
      v-else
      :preloaded="preloaded"
      :server-count="data.count"
    />
  </PlaygroundDemo>
</template>
