<script setup lang="ts">
import { api } from '#convex/api'

// Rendered on the server, then kept live over a WebSocket.
const { data: messages } = useAsyncQuery(api.messages.list, {})
const send = useMutation(api.messages.send)

const body = ref('')

async function submit() {
  const text = body.value.trim()
  if (!text) return
  body.value = ''
  await send({ body: text })
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <h1>Nuxt + Convex</h1>
    <form @submit.prevent="submit">
      <input v-model="body" placeholder="Write a message">
      <button type="submit">
        Send
      </button>
    </form>
    <ul>
      <li v-for="message in messages" :key="message._id">
        {{ message.body }}
      </li>
    </ul>
  </div>
</template>
