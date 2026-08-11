<script setup lang="ts">
import { api } from '#convex/api'

// The bench test — and it is an actual test, not a diagram. Two independent
// `DemoClientPane`s, each opening its OWN `useQuery` on `messages.list`. This
// component never hands them rows; the only thing joining the two panes is the
// deployment. Write into one and the other updates because both are
// subscribed, which is the entire claim this section makes.
//
// The bus in the middle reports the real client: WebSocket state comes off
// `useConvexConnectionState`, and the millisecond figure is the measured time
// from dispatching a mutation to the server acknowledging it.
const sides = ['A', 'B'] as const
type Side = typeof sides[number]

const connection = useConvexConnectionState()
const send = useMutation(api.messages.send)

const online = computed(() => connection.value?.isWebSocketConnected !== false)
const inflight = computed(() => Number(connection.value?.inflightMutations ?? 0) > 0)

const busy = ref<Side | null>(null)
const rtt = ref<number | null>(null)
const rejection = ref<string | null>(null)

// Distinct handles per pane so an arriving row is visibly attributed — you can
// watch B's write land in A's list wearing B's tag. Randomised after mount so
// two visitors don't collide (and so SSR has nothing random to mismatch on).
const handles = reactive<Record<Side, string>>({ A: 'client-a', B: 'client-b' })
onMounted(() => {
  const tag = Math.random().toString(36).slice(2, 5)
  handles.A = `a-${tag}`
  handles.B = `b-${tag}`
})

async function submit(side: Side, body: string) {
  const text = body.trim() || `hello from client ${side}`
  if (busy.value) return
  busy.value = side
  rejection.value = null
  const t0 = performance.now()
  try {
    await send({ author: handles[side], body: text })
    rtt.value = Math.round(performance.now() - t0)
  }
  catch (e) {
    // The table is public, so the mutation moderates every write; the reason
    // arrives as a ConvexError payload and is worth showing.
    const data = (e as { data?: unknown })?.data
    rejection.value = typeof data === 'string' ? data : 'Message rejected.'
  }
  finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="grid grid-cols-1 items-stretch gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
    <DemoClientPane
      v-for="side in sides"
      :key="side"
      :side="side"
      :handle="handles[side]"
      :busy="busy === side"
      :online="online"
      :style="{ order: side === 'A' ? 1 : 3 }"
      @send="body => submit(side, body)"
    />

    <!-- The sync bus — an etched channel with a hub LED between the clients. -->
    <div class="order-2 flex min-w-[118px] flex-col items-center gap-2 self-center max-md:w-full max-md:min-w-0">
      <span class="etched font-mono text-[0.58rem] font-semibold tracking-[0.14em] whitespace-nowrap text-toned">CONVEX SYNC</span>
      <div
        class="flex w-full items-center"
        aria-hidden="true"
      >
        <span
          class="h-0.5 flex-1 rounded-full transition-[background,box-shadow] duration-150 ease-out"
          :class="(busy === 'A' || inflight) ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-border-accented)'"
        />
        <span class="mx-1 grid size-[26px] flex-none place-items-center rounded-full bg-(image:--grad-surface) shadow-(--elev-1)">
          <i
            class="size-2 rounded-full transition-[background,box-shadow] duration-150 ease-out"
            :class="(!!busy || inflight) ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-text-dimmed)'"
          />
        </span>
        <span
          class="h-0.5 flex-1 rounded-full transition-[background,box-shadow] duration-150 ease-out"
          :class="(busy === 'B' || inflight) ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-border-accented)'"
        />
      </div>
      <span
        class="etched min-h-[1em] font-mono text-[0.58rem] font-semibold tracking-[0.14em] whitespace-nowrap"
        :class="(rejection || !online) ? 'text-error' : 'text-primary-700 dark:text-primary-300'"
      >{{
        rejection ? 'REJECTED' : !online ? 'NO SOCKET' : rtt === null ? 'WS OPEN' : `${rtt} MS`
      }}</span>
      <!-- The moderation reason — a sentence, so it drops the mono/tracking
           of the readouts above it and is allowed to wrap. -->
      <p
        v-if="rejection"
        class="m-0 max-w-60 text-center text-[0.7rem] leading-[1.4] text-error"
      >
        {{ rejection }}
      </p>
    </div>
  </div>
</template>
