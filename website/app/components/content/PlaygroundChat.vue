<script setup lang="ts">
import { api } from '#convex/api'

// Live chat: `useQuery` streams the message list over the WebSocket;
// `useMutation` sends. Open the page in a second tab to see updates propagate.
const messages = useQuery(api.messages.list, {})
const send = useMutation(api.messages.send)
const clear = useMutation(api.messages.clear)

const author = ref('')
const body = ref('')
const error = ref<string>()
const sending = ref(false)

async function submit() {
  error.value = undefined
  sending.value = true
  try {
    await send({ author: author.value.trim() || 'anonymous', body: body.value })
    body.value = ''
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <PlaygroundDemo title="Live chat — useQuery + useMutation">
    <div class="chat">
      <p
        v-if="messages === undefined"
        class="chat-loading"
      >
        Loading messages…
      </p>
      <ul
        v-else-if="messages.length > 0"
        class="chat-list"
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
        class="chat-loading"
      >
        No messages yet — say something!
      </p>

      <form
        class="chat-form"
        @submit.prevent="submit"
      >
        <input
          v-model="author"
          class="chat-input chat-author"
          placeholder="Name"
          aria-label="Author"
        >
        <input
          v-model="body"
          class="chat-input"
          placeholder="Message"
          aria-label="Message"
        >
        <button
          class="chat-button"
          type="submit"
          :disabled="sending"
        >
          {{ sending ? 'Sending…' : 'Send' }}
        </button>
        <button
          class="chat-button chat-button-subtle"
          type="button"
          :disabled="!messages || messages.length === 0"
          @click="clear({})"
        >
          Clear
        </button>
      </form>
      <p
        v-if="error"
        class="chat-error"
      >
        {{ error }}
      </p>
    </div>
  </PlaygroundDemo>
</template>

<style scoped>
.chat-list {
  max-height: 14rem;
  overflow-y: auto;
  margin: 0 0 1rem;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.chat-loading {
  margin: 0 0 1rem;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.chat-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chat-input {
  flex: 1;
  min-width: 8rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg);
  font-size: 0.875rem;
}

.chat-author {
  flex: 0 1 8rem;
}

.chat-button {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.chat-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-button-subtle {
  color: var(--ui-text-muted);
}

.chat-error {
  margin: 0.5rem 0 0;
  color: var(--ui-color-error-500, #ef4444);
  font-size: 0.8125rem;
}
</style>
