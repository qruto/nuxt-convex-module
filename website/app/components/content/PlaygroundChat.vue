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
    // Moderation and rate-limit rejections arrive as ConvexError payloads —
    // render the reason, not the raw server-error dump.
    error.value = demoRejectionReason(e)
  }
  finally {
    sending.value = false
  }
}

async function reset() {
  error.value = undefined
  try {
    await clear({})
  }
  catch (e) {
    // The reset rides a one-per-minute cooldown server-side; a rejection
    // here is expected traffic, not a crash.
    error.value = demoRejectionReason(e)
  }
}
</script>

<template>
  <PlaygroundDemo title="Live chat — useQuery + useMutation">
    <p
      v-if="messages === undefined"
      class="m-0 mb-4 text-sm text-muted"
    >
      Loading messages…
    </p>
    <PlaygroundMessageList
      v-else
      :messages="messages"
      empty="No messages yet — say something!"
    />

    <form
      class="flex flex-wrap gap-2"
      @submit.prevent="submit"
    >
      <UInput
        v-model="author"
        placeholder="Name"
        aria-label="Author"
        class="w-32 flex-none"
      />
      <UInput
        v-model="body"
        placeholder="Message"
        aria-label="Message"
        class="min-w-32 flex-1"
      />
      <UButton
        type="submit"
        color="primary"
        :loading="sending"
      >
        Send
      </UButton>
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        :disabled="!messages || messages.length === 0"
        @click="reset"
      >
        Clear
      </UButton>
    </form>
    <p
      v-if="error"
      class="m-0 mt-2 text-xs text-error"
    >
      {{ error }}
    </p>
  </PlaygroundDemo>
</template>
