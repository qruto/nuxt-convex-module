<script setup lang="ts">
// The bench test: two clients subscribed to the same query, joined by a
// sync bus. The sync is simulated in-page (no server dependency on the
// homepage) and says so — the playground runs the real thing.
type Side = 'A' | 'B'
interface Msg { id: number, who: Side, body: string }

const sides: Side[] = ['A', 'B']

const messages = ref<Msg[]>([
  { id: 1, who: 'A', body: 'hi' },
  { id: 2, who: 'B', body: 'seen by every subscriber' },
])
const drafts = reactive<Record<Side, string>>({ A: '', B: '' })
const sender = ref<Side | null>(null)
const phase = ref<'idle' | 'tx' | 'commit'>('idle')
const rtt = ref<number | null>(null)
let nextId = 3

function send(who: Side) {
  if (phase.value !== 'idle') return
  const body = drafts[who].trim() || 'hi'
  drafts[who] = ''
  sender.value = who
  phase.value = 'tx'
  const t0 = performance.now()
  setTimeout(() => {
    // One mutation in → the shared subscription pushes to both lists.
    messages.value = [...messages.value.slice(-4), { id: nextId++, who, body }]
    rtt.value = Math.round(performance.now() - t0)
    phase.value = 'commit'
    setTimeout(() => {
      phase.value = 'idle'
      sender.value = null
    }, 360)
  }, 110)
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
          Both clients below subscribe to the same query. Send from either
          side — the mutation lands once and every subscription updates on
          the same tick. The sync here is simulated in-page; the
          <NuxtLink
            to="/playground"
            class="ldm-link"
          >playground</NuxtLink>
          runs it against a real deployment.
        </p>
      </header>

      <div class="ldm-bench">
        <article
          v-for="side in sides"
          :key="side"
          class="ldm-client"
          :style="{ order: side === 'A' ? 1 : 3 }"
        >
          <header class="ldm-client-top mono">
            <span class="etched">CLIENT {{ side }}</span>
            <span
              class="ldm-conn"
              :class="{ tx: phase === 'tx' && sender === side }"
            >
              <i aria-hidden="true" />
              {{ phase === 'tx' && sender === side ? 'TX' : 'SUBSCRIBED' }}
            </span>
          </header>

          <ul
            class="ldm-list mono"
            aria-live="polite"
          >
            <li
              v-for="m in messages"
              :key="m.id"
              class="ldm-msg"
            >
              <span
                class="ldm-who"
                :class="{ self: m.who === side }"
              >{{ m.who }}</span>
              {{ m.body }}
            </li>
          </ul>

          <form
            class="ldm-send"
            @submit.prevent="send(side)"
          >
            <input
              v-model="drafts[side]"
              class="input"
              placeholder="send({ body: '…' })"
              :aria-label="`Message from client ${side}`"
            >
            <button
              class="btn primary"
              type="submit"
            >
              Send
            </button>
          </form>
        </article>

        <div
          class="ldm-bus"
          aria-hidden="true"
        >
          <span class="ldm-bus-label mono etched">CONVEX SYNC</span>
          <div class="ldm-channel">
            <span
              class="ldm-line"
              :class="{ on: (phase === 'tx' && sender === 'A') || phase === 'commit' }"
            />
            <span
              class="ldm-hub"
              :class="{ on: phase !== 'idle' }"
            ><i /></span>
            <span
              class="ldm-line"
              :class="{ on: (phase === 'tx' && sender === 'B') || phase === 'commit' }"
            />
          </div>
          <span class="ldm-rtt mono etched">{{ rtt === null ? 'WS OPEN' : `${rtt} MS` }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ldm-head { margin-bottom: 2rem; }

.ldm-link { color: var(--accent-soft); text-underline-offset: 3px; }
.ldm-link:hover { color: var(--accent); }

.ldm-bench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 1.2rem;
  align-items: stretch;
}

/* A client unit: raised plate with a recessed readout well. */
.ldm-client {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  border: 1px solid transparent;
  border-radius: var(--r-lg);
  background:
    var(--grad-surface) padding-box,
    var(--grad-bevel) border-box;
  box-shadow: var(--elev-1);
  padding: 1.1rem 1.2rem 1.2rem;
}

.ldm-client-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.13em;
}
.ldm-conn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ink-faint);
}
.ldm-conn i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ok);
  box-shadow: var(--glow-ok);
}
.ldm-conn.tx { color: var(--accent-soft); }
.ldm-conn.tx i { background: var(--accent); box-shadow: var(--glow-accent-soft); }

/* The readout well — fixed height, latest at the bottom like a log. */
.ldm-list {
  list-style: none;
  margin: 0;
  padding: 0.7rem 0.9rem;
  height: 9.2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  overflow: hidden;
  background: var(--sink);
  border-radius: 12px;
  box-shadow: var(--inset-2);
  font-size: 0.78rem;
}
.ldm-msg {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--ink);
  animation: fade-up 0.24s var(--ease-out) both;
  overflow-wrap: anywhere;
}
.ldm-who {
  flex: none;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  border: 1px solid var(--edge-hi);
  border-radius: 5px;
  padding: 0.05rem 0.3rem;
}
.ldm-who.self { color: var(--accent-soft); border-color: var(--accent-glow); }

.ldm-send { display: flex; gap: 0.6rem; }
.ldm-send .input { font-family: var(--mono); font-size: 0.8rem; }
.ldm-send .btn { flex: none; }

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
