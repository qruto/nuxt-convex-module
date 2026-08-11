<script setup lang="ts">
import { api } from '#convex/api'

// One pane of the homepage bench. The point of this file existing as its own
// component is that the subscription lives HERE: each pane opens its own
// `useQuery` on `messages.list` and knows nothing about its sibling. Neither
// pane is handed rows by the parent, so when both move together it is the
// deployment doing it, not a shared `ref`. Two subscriptions, one socket —
// exactly how the client dedupes upstream.
defineProps<{
  side: string
  handle: string
  busy: boolean
  online: boolean
}>()

const emit = defineEmits<{ send: [body: string] }>()

const messages = useQuery(api.messages.list, {})

// Latest five, so the well reads as a running log rather than a wall.
const log = computed(() => (messages.value ?? []).slice(-5))
const draft = ref('')

function submit() {
  emit('send', draft.value)
  draft.value = ''
}
</script>

<template>
  <article class="plate flex flex-col gap-3 px-5 pt-4.5 pb-5">
    <header class="flex items-center justify-between font-mono text-[0.65rem] font-semibold tracking-[0.13em]">
      <span class="etched text-toned">CLIENT {{ side }}</span>
      <span
        class="inline-flex items-center gap-1.5"
        :class="busy ? 'text-primary' : 'text-dimmed'"
      >
        <i
          aria-hidden="true"
          class="size-1.5 rounded-full"
          :class="busy
            ? 'bg-primary shadow-(--glow-primary-soft)'
            : online ? 'bg-success shadow-(--glow-success)' : 'bg-(--ui-text-dimmed)'"
        />
        {{ busy ? 'TX' : online ? 'SUBSCRIBED' : 'OFFLINE' }}
      </span>
    </header>

    <!-- The readout well — latest at the bottom like a log. Bounded, not
         fixed: a hard height leaves a dead void while the table fills up. -->
    <ul
      class="well m-0 flex min-h-[4.4rem] max-h-[9.2rem] list-none flex-col justify-end gap-1.5 overflow-hidden px-4 py-3 font-mono text-xs"
      aria-live="polite"
    >
      <li
        v-for="m in log"
        :key="m._id"
        class="flex min-w-0 items-baseline gap-2 text-default motion-safe:animate-fade-up [animation-duration:240ms]"
      >
        <span
          class="max-w-[8ch] flex-none truncate rounded-[5px] border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em]"
          :class="m.author === handle
            ? 'text-primary-700 border-primary/40 dark:text-primary-300'
            : 'text-muted border-accented'"
        >{{ m.author }}</span>
        <span class="min-w-0 truncate">{{ m.body }}</span>
      </li>
      <li
        v-if="!log.length"
        class="text-muted"
      >
        {{ messages === undefined ? 'subscribing…' : 'no rows yet' }}
      </li>
    </ul>

    <form
      class="flex gap-2.5"
      @submit.prevent="submit"
    >
      <!-- The composer input — a concave well carved into the plate. -->
      <input
        v-model="draft"
        :disabled="!online"
        maxlength="140"
        placeholder="send({ body: '…' })"
        :aria-label="`Message from client ${side}`"
        class="w-full min-w-0 rounded-md border-0 bg-(image:--grad-sink) px-3 py-2.5 font-mono text-[0.8rem] text-highlighted shadow-(--inset-1) transition-shadow duration-180 ease-out placeholder:text-dimmed focus:ring-2 focus:ring-primary focus:outline-none"
      >
      <UButton
        type="submit"
        color="primary"
        class="flex-none"
        :disabled="busy || !online"
      >
        {{ busy ? 'sending' : 'send' }}
      </UButton>
    </form>
  </article>
</template>
