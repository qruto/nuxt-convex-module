<template>
  <main style="max-width: 40rem; margin: 2rem auto; font-family: sans-serif">
    <h1>Nuxt ✕ Convex</h1>

    <form style="display: flex; gap: 0.5rem" @submit.prevent="submit">
      <input
        v-model="draft"
        placeholder="Say something…"
        style="flex: 1; padding: 0.5rem"
      >
      <button type="submit">Send</button>
    </form>

    <p v-if="status === 'pending'">Loading…</p>
    <p v-else-if="error">{{ error.message }}</p>
    <ul v-else>
      <li v-for="message in messages" :key="message._id">
        {{ message.body }}
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { api } from '#backend/api'

// SSR-rendered AND live: fetched on the server, hydrated through the Nuxt
// payload, then upgraded to a realtime WebSocket subscription on the client.
const { data: messages, status, error } = useAsyncQuery(api.messages.list, {})

const send = useMutation(api.messages.send)
const draft = ref('')

async function submit() {
  const body = draft.value.trim()
  if (!body) return
  draft.value = ''
  await send({ body })
}
</script>
