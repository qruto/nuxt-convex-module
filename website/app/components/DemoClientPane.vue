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
  <article class="pane">
    <header class="pane-top mono">
      <span class="etched">CLIENT {{ side }}</span>
      <span
        class="pane-conn"
        :class="{ tx: busy, off: !online }"
      >
        <i aria-hidden="true" />
        {{ busy ? 'TX' : online ? 'SUBSCRIBED' : 'OFFLINE' }}
      </span>
    </header>

    <ul
      class="pane-list mono"
      aria-live="polite"
    >
      <li
        v-for="m in log"
        :key="m._id"
        class="pane-msg"
      >
        <span
          class="pane-who"
          :class="{ self: m.author === handle }"
        >{{ m.author }}</span>
        <span class="pane-body">{{ m.body }}</span>
      </li>
      <li
        v-if="!log.length"
        class="pane-msg pane-empty"
      >
        {{ messages === undefined ? 'subscribing…' : 'no rows yet' }}
      </li>
    </ul>

    <form
      class="pane-send"
      @submit.prevent="submit"
    >
      <input
        v-model="draft"
        class="input pane-input"
        :disabled="!online"
        maxlength="140"
        placeholder="send({ body: '…' })"
        :aria-label="`Message from client ${side}`"
      >
      <button
        class="btn primary"
        type="submit"
        :disabled="busy || !online"
      >
        {{ busy ? 'sending' : 'send' }}
      </button>
    </form>
  </article>
</template>

<style scoped>
/* A client unit: raised plate with a recessed readout well. */
.pane {
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

.pane-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.13em;
}
.pane-conn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ink-faint);
}
.pane-conn i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ok);
  box-shadow: var(--glow-ok);
}
.pane-conn.tx { color: var(--accent-soft); }
.pane-conn.tx i { background: var(--accent); box-shadow: var(--glow-accent-soft); }
.pane-conn.off i { background: var(--ink-faint); box-shadow: none; }

/* The readout well — fixed height, latest at the bottom like a log. */
.pane-list {
  list-style: none;
  margin: 0;
  padding: 0.8rem 0.95rem;
  /* Bounded, not fixed — see the same note in LandingHero: a hard height
     leaves a dead void above the rows while the table is still filling up. */
  min-height: 4.4rem;
  max-height: 9.2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  overflow: hidden;
  background: var(--grad-sink);
  border-radius: 12px;
  box-shadow: var(--inset-2);
  font-size: 0.78rem;
}
.pane-msg {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--ink);
  animation: fade-up 0.24s var(--ease-out) both;
  min-width: 0;
}
.pane-body {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pane-empty { color: var(--ink-faint); }
.pane-who {
  flex: none;
  max-width: 8ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
  border: 1px solid var(--edge-hi);
  border-radius: 5px;
  padding: 0.05rem 0.3rem;
}
.pane-who.self { color: var(--accent-soft); border-color: var(--accent-glow); }

.pane-send { display: flex; gap: 0.6rem; }
.pane-input { font-family: var(--mono); font-size: 0.8rem; }
.pane-send .btn { flex: none; }
</style>
