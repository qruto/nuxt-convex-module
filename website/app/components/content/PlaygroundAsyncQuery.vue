<script setup lang="ts">
import { api } from '#convex/api'

// One composable end to end: fetched on the server during SSR, hydrated
// through the Nuxt payload, then upgraded to a live WebSocket subscription —
// Nuxt's familiar { data, status, error, refresh } shape.
const { data: messages, status, error, refresh } = useAsyncQuery(api.messages.list, {})
</script>

<template>
  <PlaygroundDemo title="useAsyncQuery — SSR data, then live">
    <div
      v-if="error"
      class="flex flex-wrap items-center gap-3"
    >
      <p class="m-0 text-sm text-muted">
        The SSR fetch couldn't reach the Convex deployment.
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
    <template v-else>
      <p class="m-0 mb-2 text-sm text-muted">
        status: <ProseCode>{{ status }}</ProseCode> — rendered on the server, live afterwards
        (post a message in the chat demo and it appears here instantly).
      </p>
      <ul class="m-0 flex list-disc flex-col gap-1 ps-5 text-sm text-default">
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
