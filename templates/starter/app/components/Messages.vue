<script setup lang="ts">
import { api } from '#convex/api'

const emit = defineEmits<{ sent: [], received: [] }>()

// Rendered on the server, then kept live over a WebSocket: a change to the
// `messages` table reaches every open tab without a reload.
const { data: messages } = useAsyncQuery(api.messages.list, {})
const send = useMutation(api.messages.send)

watch(messages, () => emit('received'))

const body = ref('')

async function submit() {
  const text = body.value.trim()
  if (!text) return
  emit('sent')
  await send({ body: text })
  // Keep anything typed while the message was sending.
  if (body.value.trim() === text) body.value = ''
}
</script>

<template>
  <div class="messages">
    <div class="heading">
      <h2>Messages</h2>
      <p>Saved in Convex. Open this page in a second tab and send one: both tabs update.</p>
    </div>

    <form class="composer" @submit.prevent="submit">
      <input
        v-model="body"
        class="field concave"
        aria-label="Message"
        placeholder="Write a message"
        maxlength="280"
        autocomplete="off"
      >
      <button class="button convex-accent" type="submit" :disabled="!body.trim()">
        Send
      </button>
    </form>

    <TransitionGroup tag="ul" name="message" class="list concave">
      <li v-for="message in messages" :key="message._id">
        {{ message.body }}
      </li>
      <li v-if="!messages?.length" key="empty" class="empty">
        No messages yet. Send the first one.
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.messages {
  display: grid;
  gap: 1rem;
}

.heading {
  display: grid;
  gap: 0.25rem;
  padding: 0.5rem 0.5rem 0;
}

.heading h2 {
  font-size: 1.125rem;
}

.heading p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.composer {
  display: flex;
  gap: 0.5rem;
}

.field {
  flex: 1;
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.5rem 0.9rem;
  border: 0;
  border-radius: var(--radius-recess);
  color: var(--text-strong);
  font: inherit;
}

.field::placeholder {
  color: var(--text-muted);
}

.list {
  max-height: 18rem;
  margin: 0;
  padding: 0.25rem 0.375rem;
  overflow-y: auto;
  border-radius: var(--radius-recess);
  list-style: none;
}

.list li {
  padding: 0.6rem;
  border-radius: 0.5rem;
  overflow-wrap: anywhere;
}

.list li + li {
  box-shadow: 0 -1px 0 light-dark(rgb(0 0 0 / 0.07), rgb(0 0 0 / 0.35));
}

.list .empty {
  padding: 1.25rem 1rem;
  color: var(--text-muted);
  text-align: center;
}

/* A message pushed from Convex settles in from above, lit for a moment. */
.message-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.message-enter-active {
  transition: opacity 250ms, transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
  animation: arrive 1.4s ease-out;
}

.message-move {
  transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes arrive {
  from { background: color-mix(in oklab, var(--signal-500) 24%, transparent); }
  to { background: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .message-enter-active,
  .message-move {
    transition: none;
  }
}
</style>
