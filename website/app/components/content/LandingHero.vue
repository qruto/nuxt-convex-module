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

// The published version, read off the npm registry (cached server-side for an
// hour) rather than pinned in the markup — a hardcoded number is wrong from
// the next release onward. Unresolvable → the chip is simply omitted.
const { data: npm } = await useFetch('/api/npm-version', { default: () => ({ version: null }) })
const npmVersion = computed(() => npm.value?.version ?? null)
const send = useMutation(api.messages.send)
const connection = useConvexConnectionState()

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
  <section class="lh">
    <div class="lh-inner">
      <div class="lh-copy">
        <p class="ld-eyebrow lh-eyebrow etched">
          <span
            class="ld-tick"
            aria-hidden="true"
          />
          NUXT MODULE · CONVEX CLIENT LIBRARY
        </p>
        <h1 class="lh-title">
          Convex for Vue&nbsp;&amp;&nbsp;Nuxt,
          <span class="lh-title-accent text-grad">machined to match upstream.</span>
        </h1>
        <p class="lh-lead">
          The Convex client for Vue and Nuxt — reactive live queries, mutations,
          actions, cursor pagination, file storage and SSR, auto-imported and
          typed against your deployment. Better Auth and Polar wire themselves
          up when installed.
        </p>
        <div class="lh-cta">
          <NuxtLink
            to="/getting-started/introduction"
            class="btn primary lh-btn"
          >
            get started
            <span aria-hidden="true">→</span>
          </NuxtLink>
          <a
            href="https://github.com/qruto/nuxt-convex-module"
            target="_blank"
            rel="noopener"
            class="lh-link"
          >
            <UIcon
              name="i-simple-icons-github"
              class="lh-link-icon"
              aria-hidden="true"
            />
            github
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="#operation"
            class="lh-link"
          >
            see it run
            <span aria-hidden="true">↓</span>
          </a>
        </div>
        <ul
          class="lh-spec mono etched"
          aria-label="Kit baselines"
        >
          <li v-if="npmVersion">
            V{{ npmVersion }}
          </li>
          <li>NUXT ≥ 4.1</li>
          <li>CONVEX 1.42</li>
        </ul>
      </div>

      <figure
        class="hp noise sheen"
        aria-label="A live Convex query in Vue: the source above renders the output below"
      >
        <header class="hp-top mono">
          <span class="hp-file etched">app.vue</span>
          <span
            class="hp-led"
            :class="{ off: !online }"
          ><i aria-hidden="true" />{{ online ? 'LIVE' : 'OFFLINE' }}</span>
        </header>

        <div class="hp-well hp-src">
          <pre class="hp-code mono"><code><span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'#convex/api'</span>

<span class="tk-k">const</span> { data } = <span class="tk-k">await</span> <span class="tk-f">useAsyncQuery</span>(api.messages.list, {})
<span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</code></pre>
        </div>

        <div
          class="hp-link mono etched"
          aria-hidden="true"
        >
          <span class="hp-link-line" />
          <span class="hp-link-label">RENDERS</span>
          <span class="hp-link-line" />
        </div>

        <div class="hp-well hp-out">
          <ul
            class="hp-list mono"
            aria-live="polite"
          >
            <li
              v-for="m in shown"
              :key="m._id"
              class="hp-msg"
            >
              <span
                class="hp-who"
                :class="{ self: m.author === handle }"
              >{{ m.author }}</span>
              <span class="hp-body">{{ m.body }}</span>
            </li>
            <li
              v-if="!shown.length"
              class="hp-msg hp-empty"
            >
              {{ error ? 'deployment unreachable' : 'the table is empty — write the first row ↓' }}
            </li>
          </ul>
        </div>

        <form
          class="hp-send"
          @submit.prevent="submit"
        >
          <label
            class="hp-send-field"
            :class="{ busy: sending }"
          >
            <span class="sr-only">Write a message to the live Convex table</span>
            <span
              class="hp-send-handle mono"
              aria-hidden="true"
            >{{ handle }}</span>
            <input
              v-model="draft"
              class="hp-send-input mono"
              :disabled="!!error"
              maxlength="140"
              placeholder="write a row…"
            >
          </label>
          <button
            class="btn primary hp-send-btn"
            type="submit"
            :disabled="sending || !draft.trim() || !!error"
          >
            {{ sending ? 'sending' : 'send' }}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <figcaption class="hp-foot mono">
          <span class="hp-stat etched dim"><i
            class="hp-dot"
            :class="online ? 'ok' : 'off'"
            aria-hidden="true"
          />{{ online ? 'WS OPEN' : 'NO SOCKET' }}</span>
          <span class="hp-stat etched dim">{{ (data ?? []).length }} DOCUMENTS</span>
          <span
            v-if="rejection"
            class="hp-stat etched hp-fail"
          >{{ rejection }}</span>
          <span
            v-else-if="rtt !== null"
            class="hp-stat etched hp-rtt"
          >COMMIT {{ rtt }} MS</span>
          <span
            v-else
            class="hp-stat etched dim"
          >SSR HYDRATED</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
/* ── Hero ground — brushed grain + a whisper of accent glow.
   Full-bleed: the section owns its stretch of the canvas. */
.lh {
  background-image:
    radial-gradient(1000px 560px at 88% -10%, var(--accent-dim), transparent 62%),
    repeating-linear-gradient(
      180deg,
      transparent 0 3px,
      light-dark(rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.012)) 3px 4px
    );
  border-bottom: 1px solid var(--edge);
}

.lh-inner {
  max-width: 1120px;
  margin-inline: auto;
  padding: clamp(3rem, 9vh, 5.5rem) 1.5rem clamp(3rem, 8vh, 5rem);
  display: grid;
  /* Tilted toward the panel: the copy caps itself at 34rem anyway, and the
     source well needs every pixel to seat its longest line without clipping. */
  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ── Copy column — staggered settle on load ───────────────────── */
.lh-copy > * { animation: fade-up 0.5s var(--ease-out) both; }
.lh-copy > :nth-child(2) { animation-delay: 60ms; }
.lh-copy > :nth-child(3) { animation-delay: 120ms; }
.lh-copy > :nth-child(4) { animation-delay: 180ms; }
.lh-copy > :nth-child(5) { animation-delay: 240ms; }

.lh-eyebrow { margin-bottom: 1.1rem; }

.lh-title {
  font-family: var(--display);
  font-weight: 700;
  font-size: clamp(2.1rem, 3.6vw, 2.9rem);
  line-height: 1.08;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 1.1rem;
}
.lh-title-accent { display: block; }

.lh-lead {
  font-family: var(--font);
  font-size: 1.02rem;
  line-height: 1.65;
  color: var(--ink-dim);
  max-width: 34rem;
  margin: 0 0 1.6rem;
}

.lh-cta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 1.25rem; margin: 0 0 1.5rem; }
.lh-btn { padding: 0.65rem 1.25rem; font-size: 0.95rem; }

/* Secondary actions sit ON the canvas — no plate. Only the primary action
   gets material; giving GitHub a raised surface too made two peers out of a
   destination and a detour. */
.lh-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font);
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--ink-dim);
  text-decoration: none;
  transition: color var(--transition);
}
.lh-link:hover { color: var(--accent); }
.lh-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
.lh-link-icon { width: 1.05em; height: 1.05em; flex: none; }

.lh-spec {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}
.lh-spec li { display: flex; align-items: center; }
.lh-spec li + li::before {
  content: '·';
  margin-inline: 0.7rem;
  color: var(--ink-faint);
}

/* ── The instrument panel — a chamfered plate, no hardware ────── */
.hp {
  position: relative;
  margin: 0;
  border: 1px solid transparent;
  border-radius: 26px;
  background:
    var(--grad-surface) padding-box,
    var(--grad-bevel) border-box;
  box-shadow: var(--elev-3);
  padding: 1.25rem 1.5rem 1.2rem;
  animation: hp-settle 0.7s var(--ease-out) both;
  animation-delay: 160ms;
}
@keyframes hp-settle {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Markings row. */
.hp-top,
.hp-foot {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.13em;
}
.hp-top { margin-bottom: 0.85rem; }
.hp-foot { margin-top: 0.85rem; flex-wrap: wrap; row-gap: 0.35rem; }
.hp-file { color: var(--ink-dim); text-transform: none; letter-spacing: 0.08em; }
.hp-stat { display: inline-flex; align-items: center; gap: 0.4rem; }
.etched.dim { color: var(--ink-faint); }
.hp-rtt { color: var(--accent-soft); }
/* A rejection reason is a sentence, not a code — let it take the row and
   drop the tracking so it stays readable at 0.64rem. */
.hp-fail {
  color: var(--err);
  flex: 1 1 100%;
  letter-spacing: 0.02em;
  text-transform: none;
}

.hp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.hp-dot.ok { background: var(--ok); box-shadow: var(--glow-ok); }
.hp-dot.off { background: var(--ink-faint); }

.hp-led {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--accent-soft);
}
.hp-led i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: var(--glow-accent-soft);
  animation: pulse-ring 2.4s ease-in-out infinite;
}
.hp-led.off { color: var(--ink-faint); }
.hp-led.off i { background: var(--ink-faint); box-shadow: none; animation: none; }

/* Inset wells — source and rendered output, dished below the plate. */
.hp-well {
  background: var(--grad-sink);
  border-radius: 14px;
  box-shadow: var(--inset-2);
  padding: 1rem 1.15rem;
  overflow-x: auto;
}
.hp-src { container-type: inline-size; }
.hp-code {
  margin: 0;
  /* The snippet is fixed, known text — 59 characters at its widest, in a
     monospace whose advance is 0.61em. Rather than let it clip mid-token (or
     scroll, which reads as an accident on a hero), the type is sized off the
     well itself so the block always seats exactly, at any panel width. 0.62
     is the advance plus a hair of slack. */
  font-size: min(0.8rem, calc(100cqi / 59 / 0.62));
  line-height: 1.75;
  color: var(--ink);
  white-space: pre;
}
.tk-k { color: var(--accent-soft); }
.tk-f { color: var(--accent); font-weight: 600; }
.tk-s { color: var(--ink-dim); }

/* The connector — source feeds the output. */
.hp-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-block: 0.6rem;
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.16em;
}
.hp-link-label { flex: none; }
.hp-link-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--edge-hi) 30%, var(--edge-hi) 70%, transparent);
}
.hp-link .hp-link-line:first-child {
  background: linear-gradient(90deg, transparent, var(--accent-glow));
}
.hp-link .hp-link-line:last-child {
  background: linear-gradient(90deg, var(--accent-glow), transparent);
}

/* Rendered readout — the query result as UI. Fixed height so an arriving row
   pushes the log up instead of resizing the whole panel under the reader. */
.hp-out { padding-block: 0.85rem; overflow: hidden; }
.hp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  /* Bottom-anchored like a log. Bounded rather than fixed: a hard height left
     a dead void above the rows on a near-empty table, while an unbounded one
     would resize the whole panel every time a row lands. */
  min-height: 3.3rem;
  max-height: 6.6rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.4rem;
  font-size: 0.78rem;
}
.hp-msg {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--ink);
  animation: fade-up 0.3s var(--ease-out) both;
  min-width: 0;
}
.hp-body {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hp-empty { color: var(--ink-faint); }
.hp-who {
  flex: none;
  max-width: 7ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
  border: 1px solid var(--edge-hi);
  border-radius: 5px;
  padding: 0.05rem 0.3rem;
}
.hp-who.self { color: var(--accent-soft); border-color: var(--accent-glow); }

/* Composer — the write half of the demo. */
.hp-send {
  display: flex;
  gap: 0.55rem;
  margin-top: 0.7rem;
}
.hp-send-field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.7rem;
  border-radius: var(--r-sm);
  background: var(--grad-sink);
  box-shadow: var(--inset-1);
  transition: box-shadow var(--transition);
}
.hp-send-field:focus-within { box-shadow: var(--inset-1), 0 0 0 2px var(--accent); }
.hp-send-field.busy { opacity: 0.65; }
.hp-send-handle {
  flex: none;
  max-width: 8ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-soft);
}
.hp-send-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: var(--ink);
  font-size: 0.78rem;
  padding: 0.2rem 0;
}
.hp-send-input:focus { outline: none; }
.hp-send-input::placeholder { color: var(--ink-faint); }
.hp-send-btn { flex: none; padding: 0.45rem 0.9rem; font-size: 0.8rem; }

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .lh-inner { grid-template-columns: minmax(0, 1fr); }
  .hp { max-width: min(34rem, 100%); }
}
@media (max-width: 480px) {
  .hp { padding-inline: 1.1rem; }
  .hp-top, .hp-foot { gap: 0.7rem; }
  .hp-send { flex-wrap: wrap; }
}
</style>
