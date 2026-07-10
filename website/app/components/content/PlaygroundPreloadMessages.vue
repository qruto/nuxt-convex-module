<script setup lang="ts">
import { api } from '#convex/api'
// fallow-ignore-next-line unresolved-import -- workspace subpath resolves via the stub dist at dev time; fallow can't follow it
import type { Preloaded } from 'nuxt-convex-module/client'

const props = defineProps<{
  preloaded: Preloaded<typeof api.messages.list>
  /** One-shot `fetchQuery(api.messages.count)` result — frozen at SSR time. */
  serverCount: number
}>()

// Renders the server-preloaded value on first paint (no flicker, no refetch),
// then takes over as a live WebSocket subscription on the client.
const messages = usePreloadedQuery(() => props.preloaded)

const send = useMutation(api.messages.send)

const body = ref('')
const sending = ref(false)
const error = ref<string>()

async function submit() {
  error.value = undefined
  sending.value = true
  try {
    await send({ author: 'ssr-demo', body: body.value })
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
  <div class="preload">
    <ul
      v-if="messages && messages.length > 0"
      class="preload-list"
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
      class="preload-empty"
    >
      No messages yet — send one below.
    </p>

    <form
      class="preload-form"
      @submit.prevent="submit"
    >
      <input
        v-model="body"
        class="preload-input"
        placeholder="Message"
        aria-label="Message"
      >
      <button
        class="preload-button"
        type="submit"
        :disabled="sending"
      >
        {{ sending ? 'Sending…' : 'Send' }}
      </button>
    </form>
    <p
      v-if="error"
      class="preload-error"
    >
      {{ error }}
    </p>

    <p class="preload-meta">
      One-shot <code>fetchQuery</code> count at render time: {{ serverCount }}
      · live list now: {{ messages?.length ?? 0 }}.
      Send a message — only the live number moves.
    </p>
  </div>
</template>

<style scoped>
.preload-list {
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

.preload-empty {
  margin: 0 0 1rem;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.preload-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preload-input {
  flex: 1;
  min-width: 8rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg);
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

.preload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preload-error {
  margin: 0.5rem 0 0;
  color: var(--ui-color-error-500, #ef4444);
  font-size: 0.8125rem;
}

.preload-meta {
  margin: 0.75rem 0 0;
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
}
</style>
