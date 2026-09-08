<script setup lang="ts">
import { api } from '#convex/api'

// Rendered on the server AND live: fetched during SSR, handed to the client
// through the Nuxt payload, then upgraded to a realtime WebSocket subscription.
// View source to see the messages in the HTML; open a second tab to watch both
// update at once.
const { data: messages, status } = useAsyncQuery(api.messages.list, {})

const send = useMutation(api.messages.send)
const clear = useMutation(api.messages.clear)

// A shallowRef of the live ConnectionState — this is what the pill reads.
const connection = useConvexConnectionState()

const author = ref('')
const body = ref('')
const failure = ref<string | null>(null)

async function submit() {
  const text = body.value.trim()
  if (!text) return

  // Optimistic in feel: clear the input first, so the round trip is invisible
  // when the deployment is healthy.
  body.value = ''
  failure.value = null

  try {
    await send({ author: author.value, body: text })
  }
  catch (error) {
    body.value = text
    failure.value = error instanceof Error ? error.message : String(error)
  }
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <section>
    <div class="bar">
      <span class="pill" :class="{ live: connection.isWebSocketConnected }">
        {{ connection.isWebSocketConnected ? 'live' : 'connecting' }}
      </span>
      <button type="button" class="ghost" @click="clear({})">Clear</button>
    </div>

    <form class="composer" @submit.prevent="submit">
      <input v-model="author" class="who" placeholder="you" aria-label="Your name">
      <input v-model="body" class="what" placeholder="Say something…" aria-label="Message">
      <button type="submit">Send</button>
    </form>

    <p v-if="failure" class="failure">{{ failure }}</p>

    <!--
      Branch on `status`, never on `error`: `useAsyncQuery` keeps the SSR error
      exposed after live data arrives, so an `v-else-if="error"` arm placed
      before the list would pin this view on a transient first-fetch failure
      even once the WebSocket is happily delivering rows.
    -->
    <p v-if="status === 'pending' || status === 'idle'" class="state">Loading…</p>

    <div v-else-if="status === 'error'" class="state error">
      <p>Could not read <code>messages:list</code> from this deployment.</p>
      <p class="hint">
        The URL is configured, so the deployment answered — it just doesn't have this app's
        functions yet. Push <code>convex/</code> to it with <code>npx convex deploy</code>,
        or point this component at functions it does have.
      </p>
    </div>

    <p v-else-if="!messages?.length" class="state">
      No messages yet — send the first one.
    </p>

    <ul v-else class="messages">
      <li v-for="message in messages" :key="message._id">
        <span class="author">{{ message.author }}</span>
        <span class="body">{{ message.body }}</span>
        <time :datetime="new Date(message._creationTime).toISOString()">
          {{ formatTime(message._creationTime) }}
        </time>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pill::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--muted);
}

.pill.live::before {
  background: #22a06b;
}

.composer {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

input {
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--ground);
  color: inherit;
  font: inherit;
}

.who {
  flex: 0 1 8rem;
}

.what {
  flex: 1 1 auto;
}

button {
  padding: 0.55rem 1rem;
  border: 1px solid transparent;
  border-radius: 7px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  cursor: pointer;
}

button.ghost {
  padding: 0.2rem 0.6rem;
  border-color: var(--line);
  background: transparent;
  color: var(--muted);
  font-size: 0.8rem;
}

.messages {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}

.messages li {
  display: grid;
  grid-template-columns: minmax(0, 8rem) 1fr auto;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.6rem 0.9rem;
}

.messages li + li {
  border-top: 1px solid var(--line);
}

.author {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.body {
  overflow-wrap: anywhere;
}

time {
  color: var(--muted);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.state {
  margin: 0;
  padding: 1.5rem;
  border: 1px dashed var(--line);
  border-radius: 10px;
  color: var(--muted);
  text-align: center;
}

.state.error {
  text-align: left;
  border-style: solid;
}

.state p {
  margin: 0.25rem 0;
}

.hint {
  font-size: 0.88rem;
}

.failure {
  margin: 0 0 1rem;
  color: var(--accent);
  font-size: 0.9rem;
}
</style>
