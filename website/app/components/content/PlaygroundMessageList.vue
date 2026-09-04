<script setup lang="ts">
// The message readout the chat and SSR-preload demos share: a bounded,
// scrolling list of `author: body` rows, or the demo's own empty-table line.
defineProps<{
  messages: { _id: string, author: string, body: string }[]
  /** Shown in place of the list while the table is empty. */
  empty: string
}>()
</script>

<template>
  <ul
    v-if="messages.length > 0"
    class="m-0 mb-4 flex max-h-56 list-none flex-col gap-1.5 overflow-y-auto p-0 text-sm text-default"
  >
    <li
      v-for="message in messages"
      :key="message._id"
    >
      <strong>{{ message.author }}</strong>: {{ message.body }}
    </li>
  </ul>
  <p
    v-else
    class="m-0 mb-4 text-sm text-muted"
  >
    {{ empty }}
  </p>
</template>
