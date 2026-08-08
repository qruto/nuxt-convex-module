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
  <section
    id="operation"
    class="ldm ld-sect"
  >
    <div class="ld-inner">
      <header class="ldm-head">
        <p class="ld-eyebrow etched">
          <span
            class="ld-tick"
            aria-hidden="true"
          />
          <span class="ld-index">01</span>
          LIVE OPERATION
        </p>
        <h2 class="ld-title">
          One table, every client
        </h2>
        <p class="ld-sub">
          Nothing below is mocked. Each pane is its own component opening its own
          <code class="inline">useQuery</code> against a real Convex deployment —
          no props between them, no refetch, no cache keys. Send from either side
          and both lists move on the same tick. Open this page in a second tab
          and it moves there too.
        </p>
      </header>

      <div class="ldm-bench">
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

        <div class="ldm-bus">
          <span class="ldm-bus-label mono etched">CONVEX SYNC</span>
          <div
            class="ldm-channel"
            aria-hidden="true"
          >
            <span
              class="ldm-line"
              :class="{ on: busy === 'A' || inflight }"
            />
            <span
              class="ldm-hub"
              :class="{ on: !!busy || inflight }"
            ><i /></span>
            <span
              class="ldm-line"
              :class="{ on: busy === 'B' || inflight }"
            />
          </div>
          <span
            class="ldm-rtt mono etched"
            :class="{ bad: rejection || !online }"
          >{{
            rejection ? 'REJECTED' : !online ? 'NO SOCKET' : rtt === null ? 'WS OPEN' : `${rtt} MS`
          }}</span>
          <p
            v-if="rejection"
            class="ldm-reason"
          >
            {{ rejection }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ldm-head { margin-bottom: 2rem; }

.ldm-bench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 1.2rem;
  align-items: stretch;
}

/* The sync bus — an etched channel with a hub LED between the clients. */
.ldm-bus {
  order: 2;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  min-width: 118px;
}
.ldm-bus-label,
.ldm-rtt {
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  white-space: nowrap;
}
.ldm-rtt { color: var(--accent-soft); min-height: 1em; }
.ldm-rtt.bad { color: var(--err); }
/* The moderation reason — a sentence, so it drops the mono/tracking of the
   readouts above it and is allowed to wrap. */
.ldm-reason {
  margin: 0;
  max-width: 15rem;
  font-size: 0.7rem;
  line-height: 1.4;
  text-align: center;
  color: var(--err);
}
.ldm-channel { display: flex; align-items: center; width: 100%; }
.ldm-line {
  flex: 1;
  height: 2px;
  border-radius: 1px;
  background: var(--edge-hi);
  transition: background 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out);
}
.ldm-line.on { background: var(--accent); box-shadow: var(--glow-accent-soft); }
.ldm-hub {
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  margin-inline: 4px;
  border-radius: 50%;
  background: var(--grad-surface);
  box-shadow: var(--elev-1);
}
.ldm-hub i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink-faint);
  transition: background 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out);
}
.ldm-hub.on i { background: var(--accent); box-shadow: var(--glow-accent-soft); }

@media (max-width: 860px) {
  .ldm-bench { grid-template-columns: minmax(0, 1fr); }
  .ldm-bus { width: 100%; min-width: 0; }
}
</style>
