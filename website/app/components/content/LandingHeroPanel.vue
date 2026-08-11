<script setup lang="ts">
import { api } from '#convex/api'

// The hero's signature: one instrument panel where the source well renders
// into the output well beneath it — and the source is not a screenshot. The
// four lines printed on the plate are the four lines running the plate. The
// rows underneath come off a real Convex deployment over a real WebSocket,
// and the composer writes to it. Type into the hero and it lands in the table;
// leave the tab open and someone else's message lands in yours.
//
// `useAsyncQuery` (not `useQuery`) so the rows are in the server-rendered HTML
// on first paint — no loading flicker in the most-looked-at box on the site —
// and upgrade to a live subscription on hydration. The panel therefore
// demonstrates the SSR story and the live story in one object.
// Destructured as `data` (not renamed) so the snippet printed on the plate is
// character-for-character the code behind it.
const { data, error } = await useAsyncQuery(api.messages.list, {})

const send = useMutation(api.messages.send)
const connection = useConvexConnectionState()

// The published version comes off the npm registry (cached server-side for an
// hour) rather than pinned in the markup — a hardcoded number is wrong from
// the next release onward. Unresolvable → the chip is simply omitted.
const { data: npm } = await useFetch('/api/npm-version', { default: () => ({ version: null }) })
const npmVersion = computed(() => npm.value?.version ?? null)

// Only the tail fits the well; the panel is a readout, not the archive.
const VISIBLE = 4
const shown = computed(() => (data.value ?? []).slice(-VISIBLE))

const online = computed(() => !error.value && connection.value?.isWebSocketConnected !== false)

// A per-visitor handle so your own rows are distinguishable from everyone
// else's. Generated after mount — a random value at SSR time would mismatch
// on hydration.
const handle = ref('you')
onMounted(() => {
  handle.value = `you-${Math.random().toString(36).slice(2, 5)}`
})

const draft = ref('')
const sending = ref(false)
const rtt = ref<number | null>(null)
const rejection = ref<string | null>(null)

async function submit() {
  const body = draft.value.trim()
  if (!body || sending.value) return
  sending.value = true
  rejection.value = null
  const t0 = performance.now()
  try {
    await send({ author: handle.value, body })
    // Real round trip: mutation dispatched → server committed → resolved.
    rtt.value = Math.round(performance.now() - t0)
    draft.value = ''
  }
  catch (e) {
    // The table is public, so the mutation moderates every write. A rejection
    // is a legitimate outcome to render, not a crash — and it arrives as a
    // ConvexError payload, so the actual reason is showable.
    rejection.value = reasonFor(e)
  }
  finally {
    sending.value = false
  }
}

function reasonFor(error: unknown): string {
  const data = (error as { data?: unknown })?.data
  return typeof data === 'string' ? data : 'Message rejected.'
}
</script>

<template>
  <!-- The instrument panel — a chamfered plate, radius and elevation bumped
       through the recipe seams. Its own size container: the narrow tweaks
       query the panel, not the viewport. -->
  <figure
    class="plate sheen noise @container relative m-0 px-6 pt-5 pb-5 [--plate-elev:var(--elev-3)] [--plate-radius:26px] motion-safe:animate-fade-up [animation-delay:160ms] [animation-duration:700ms] @max-[30rem]:px-4.5"
    aria-label="A live Convex query in Vue: the source above renders the output below"
  >
    <header class="mb-3.5 flex items-center gap-4 font-mono text-[0.65rem] font-semibold tracking-[0.13em] @max-[30rem]:gap-3">
      <span class="etched text-toned tracking-[0.08em]">app.vue</span>
      <span
        class="ml-auto inline-flex items-center gap-2 font-bold tracking-[0.14em]"
        :class="online ? 'text-primary-700 dark:text-primary-300' : 'text-dimmed'"
      >
        <i
          aria-hidden="true"
          class="size-2 rounded-full"
          :class="online
            ? 'bg-primary shadow-(--glow-primary-soft) motion-safe:animate-pulse-ring'
            : 'bg-(--ui-text-dimmed)'"
        />{{ online ? 'LIVE' : 'OFFLINE' }}</span>
    </header>

    <!-- Source well. The snippet is fixed, known text — 59 characters at its
         widest, in a monospace whose advance is 0.61em. Rather than clip
         mid-token (or scroll, which reads as an accident on a hero), the type
         is sized off the well itself so the block always seats exactly. -->
    <div class="well @container overflow-x-auto px-4.5 py-4 [--well-radius:14px]">
      <pre
        data-tokens
        class="m-0 font-mono text-[min(0.8rem,calc(100cqi/59/0.62))] leading-[1.75] whitespace-pre text-highlighted"
      ><code><span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'#convex/api'</span>

<span class="tk-k">const</span> { data } = <span class="tk-k">await</span> <span class="tk-f">useAsyncQuery</span>(api.messages.list, {})
<span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</code></pre>
    </div>

    <!-- The connector — source feeds the output. -->
    <div
      class="my-2.5 flex items-center gap-2.5 font-mono text-[0.56rem] font-semibold tracking-[0.16em]"
      aria-hidden="true"
    >
      <span class="h-px flex-1 bg-linear-to-r from-transparent to-primary/30" />
      <span class="etched flex-none text-toned">RENDERS</span>
      <span class="h-px flex-1 bg-linear-to-r from-primary/30 to-transparent" />
    </div>

    <!-- Rendered readout — the query result as UI. Bottom-anchored like a
         log; bounded rather than fixed so a near-empty table has no dead
         void and a full one doesn't resize the panel per row. -->
    <div class="well overflow-hidden px-4.5 py-3.5 [--well-radius:14px]">
      <ul
        class="m-0 flex max-h-[6.6rem] min-h-[3.3rem] list-none flex-col justify-end gap-1.5 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <li
          v-for="m in shown"
          :key="m._id"
          class="flex min-w-0 items-baseline gap-2 text-default motion-safe:animate-fade-up [animation-duration:300ms]"
        >
          <span
            class="max-w-[7ch] flex-none truncate rounded-[5px] border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase"
            :class="m.author === handle
              ? 'border-primary/40 text-primary-700 dark:text-primary-300'
              : 'border-accented text-muted'"
          >{{ m.author }}</span>
          <span class="min-w-0 truncate">{{ m.body }}</span>
        </li>
        <li
          v-if="!shown.length"
          class="text-muted"
        >
          {{ error ? 'deployment unreachable' : 'the table is empty — write the first row ↓' }}
        </li>
      </ul>
    </div>

    <!-- Composer — the write half of the demo. -->
    <form
      class="mt-3 flex gap-2 @max-[30rem]:flex-wrap"
      @submit.prevent="submit"
    >
      <label
        class="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-(image:--grad-sink) px-3 py-1.5 shadow-(--inset-1) transition-shadow duration-180 ease-out focus-within:ring-2 focus-within:ring-primary"
        :class="sending ? 'opacity-65' : undefined"
      >
        <span class="sr-only">Write a message to the live Convex table</span>
        <span
          class="max-w-[8ch] flex-none truncate font-mono text-[0.6rem] font-bold tracking-[0.08em] uppercase text-primary-700 dark:text-primary-300"
          aria-hidden="true"
        >{{ handle }}</span>
        <input
          v-model="draft"
          :disabled="!!error"
          maxlength="140"
          placeholder="write a row…"
          class="min-w-0 flex-1 border-0 bg-transparent py-1 font-mono text-xs text-highlighted outline-none placeholder:text-dimmed"
        >
      </label>
      <UButton
        color="primary"
        size="sm"
        type="submit"
        class="flex-none"
        :disabled="sending || !draft.trim() || !!error"
      >
        {{ sending ? 'sending' : 'send' }}
        <span aria-hidden="true">→</span>
      </UButton>
    </form>

    <figcaption class="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.65rem] font-semibold tracking-[0.13em] @max-[30rem]:gap-x-3">
      <span class="etched inline-flex items-center gap-1.5 text-dimmed"><i
        aria-hidden="true"
        class="size-1.5 rounded-full"
        :class="online ? 'bg-success shadow-(--glow-success)' : 'bg-(--ui-text-dimmed)'"
      />{{ online ? 'WS OPEN' : 'NO SOCKET' }}</span>
      <span class="etched inline-flex items-center gap-1.5 text-dimmed">{{ (data ?? []).length }} DOCUMENTS</span>
      <span
        v-if="npmVersion"
        class="etched inline-flex items-center gap-1.5 text-dimmed"
      >V{{ npmVersion }}</span>
      <span
        v-if="rejection"
        class="etched flex-1 basis-full tracking-[0.02em] text-error"
      >{{ rejection }}</span>
      <span
        v-else-if="rtt !== null"
        class="etched inline-flex items-center gap-1.5 text-primary-700 dark:text-primary-300"
      >COMMIT {{ rtt }} MS</span>
      <span
        v-else
        class="etched inline-flex items-center gap-1.5 text-dimmed"
      >SSR HYDRATED</span>
    </figcaption>
  </figure>
</template>
