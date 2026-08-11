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
  <div>
    <ul
      v-if="messages && messages.length > 0"
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
      No messages yet — send one below.
    </p>

    <form
      class="flex flex-wrap gap-2"
      @submit.prevent="submit"
    >
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
    </form>
    <p
      v-if="error"
      class="m-0 mt-2 text-xs text-error"
    >
      {{ error }}
    </p>

    <p class="m-0 mt-3 text-xs text-muted">
      One-shot <ProseCode>fetchQuery</ProseCode> count at render time: {{ serverCount }}
      · live list now: {{ messages?.length ?? 0 }}.
      Send a message — only the live number moves.
    </p>
  </div>
</template>
