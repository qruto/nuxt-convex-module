<script setup lang="ts">
// The hero's signature: one instrument panel where the source well renders
// into the output well beneath it. A beat after load, a third message
// arrives "over the wire" and the document count ticks — the live query
// demonstrated, not claimed. No fake hardware: the EDC feel is carried by
// material (bevel, depth, etched type), not by screws.
const specs = [
  { label: 'V0.1.0' },
  { label: 'MIT' },
  { label: 'NUXT ≥ 4.1' },
  { label: 'CONVEX 1.42' },
]

interface Msg { id: number, who: string, body: string }

const messages = ref<Msg[]>([
  { id: 1, who: 'ada', body: 'ship it' },
  { id: 2, who: 'lin', body: 'rendered on the server' },
])

// One-shot arrival — not a loop. Under reduced motion the entry animation
// is disabled globally, so the row simply appears.
onMounted(() => {
  setTimeout(() => {
    messages.value = [
      ...messages.value,
      { id: 3, who: 'rex', body: 'pushed from another client' },
    ]
  }, 1400)
})
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
          NUXT MODULE · PORT OF CONVEX/REACT
        </p>
        <h1 class="lh-title">
          Convex for Vue&nbsp;&amp;&nbsp;Nuxt,
          <span class="lh-title-accent text-grad">machined to match upstream.</span>
        </h1>
        <p class="lh-lead">
          nuxt-convex-module ports Convex's official React and Next.js integration
          to Vue with the same public API — live queries, mutations, actions,
          pagination, file storage, and SSR. Better Auth and Polar wire
          themselves up when installed.
        </p>
        <div class="lh-cta">
          <NuxtLink
            to="/getting-started/introduction"
            class="btn primary lh-btn"
          >
            Get started
            <span aria-hidden="true">→</span>
          </NuxtLink>
          <a
            href="https://github.com/qruto/nuxt-convex-module"
            target="_blank"
            rel="noopener"
            class="btn lh-btn"
          >
            Star on GitHub
          </a>
          <a
            href="#operation"
            class="lh-more"
          >
            See it run ↓
          </a>
        </div>
        <ul
          class="lh-spec mono etched"
          aria-label="Kit baselines"
        >
          <li
            v-for="spec in specs"
            :key="spec.label"
          >
            {{ spec.label }}
          </li>
        </ul>
      </div>

      <figure
        class="hp noise sheen"
        aria-label="A live Convex query in Vue: the source above renders the output below"
      >
        <header class="hp-top mono">
          <span class="hp-file etched">app.vue</span>
          <span class="hp-led"><i aria-hidden="true" />LIVE</span>
        </header>

        <div class="hp-well hp-src">
          <pre class="hp-code mono"><code><span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'#convex/api'</span>

<span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})
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
              v-for="m in messages"
              :key="m.id"
              class="hp-msg"
            >
              <span class="hp-who">{{ m.who }}</span>
              {{ m.body }}
            </li>
          </ul>
        </div>

        <figcaption class="hp-foot mono">
          <span class="hp-stat etched dim"><i
            class="hp-dot ok"
            aria-hidden="true"
          />WS OPEN</span>
          <span class="hp-stat etched dim">{{ messages.length }} DOCUMENTS</span>
          <span class="hp-stat etched dim">SSR HYDRATED</span>
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
  grid-template-columns: minmax(0, 1.04fr) minmax(0, 0.96fr);
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
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

.lh-cta { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin: 0 0 1.5rem; }
.lh-btn { padding: 0.65rem 1.25rem; font-size: 0.95rem; }
.lh-more {
  margin-left: 0.35rem;
  font-family: var(--font);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ink-dim);
  text-decoration: none;
  transition: color var(--transition);
}
.lh-more:hover { color: var(--accent); }
.lh-more:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

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

.hp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.hp-dot.ok { background: var(--ok); box-shadow: var(--glow-ok); }

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

/* Inset wells — source and rendered output, carved a hair below. */
.hp-well {
  background: var(--grad-sink);
  border-radius: 14px;
  box-shadow: var(--inset-2);
  padding: 1rem 1.15rem;
  overflow-x: auto;
}
.hp-code {
  margin: 0;
  font-size: 0.8rem;
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

/* Rendered readout — the query result as UI. */
.hp-out { padding-block: 0.85rem; }
.hp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.78rem;
}
.hp-msg {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  color: var(--ink);
  animation: fade-up 0.3s var(--ease-out) both;
  overflow-wrap: anywhere;
}
.hp-who {
  flex: none;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
  border: 1px solid var(--edge-hi);
  border-radius: 5px;
  padding: 0.05rem 0.3rem;
}
.hp-msg:last-child .hp-who { color: var(--accent-soft); border-color: var(--accent-glow); }

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .lh-inner { grid-template-columns: minmax(0, 1fr); }
  .hp { max-width: min(34rem, 100%); }
}
@media (max-width: 480px) {
  .hp { padding-inline: 1.1rem; }
  .hp-top, .hp-foot { gap: 0.7rem; }
}
</style>
