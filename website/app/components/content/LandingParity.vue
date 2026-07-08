<script setup lang="ts">
// Parity demonstrated, not claimed: the same feature in convex/react and
// in this kit, with the identical data lines highlighted. The chip strip
// lists real same-name surfaces from the port.
const sameNames = [
  'useQuery',
  'useQueries',
  'useMutation',
  'useAction',
  'usePaginatedQuery',
  'preloadQuery',
  'usePreloadedQuery',
  'fetchQuery',
]
</script>

<template>
  <section class="ldp ld-sect">
    <div class="ld-inner">
      <header class="ldp-head">
        <p class="ld-eyebrow etched">
          <span
            class="ld-tick"
            aria-hidden="true"
          />
          <span class="ld-index">02</span>
          PARITY
        </p>
        <h2 class="ld-title">
          The API you already know
        </h2>
        <p class="ld-sub">
          The port keeps upstream's public API, so Convex's own docs and
          examples translate line for line — the data layer reads the same
          in both frameworks.
        </p>
      </header>

      <div class="ldp-pair">
        <article class="ldp-plate">
          <header class="ldp-top mono">
            <span class="etched">REACT</span>
            <span class="etched dim">convex/react</span>
          </header>
          <pre class="ldp-code mono"><code><span class="ln tk-c">// React — convex/react</span><span class="ln"><span class="tk-k">import</span> { useQuery, useMutation } <span class="tk-k">from</span> <span class="tk-s">'convex/react'</span></span><span class="ln"><span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'../convex/_generated/api'</span></span><span class="ln" /><span class="ln hl"><span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})</span><span class="ln hl"><span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</span></code></pre>
        </article>

        <div
          class="ldp-bolt"
          aria-hidden="true"
        >
          <span class="mono">1:1</span>
        </div>

        <article class="ldp-plate">
          <header class="ldp-top mono">
            <span class="etched">VUE</span>
            <span class="etched dim">nuxt-convex-module</span>
          </header>
          <pre class="ldp-code mono"><code><span class="ln tk-c">// Vue — nuxt-convex-module</span><span class="ln tk-c">// composables auto-import in Nuxt</span><span class="ln"><span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'#backend/api'</span></span><span class="ln" /><span class="ln hl"><span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})</span><span class="ln hl"><span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</span></code></pre>
        </article>
      </div>

      <div class="ldp-strip">
        <span class="ldp-strip-label mono etched">SAME NAME · SAME SHAPE</span>
        <ul class="ldp-chips">
          <li
            v-for="name in sameNames"
            :key="name"
            class="ldp-chip mono"
          >
            {{ name }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ldp-head { margin-bottom: 2rem; }

.ldp-pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
  margin-bottom: 1.6rem;
}

.ldp-plate {
  border: 1px solid transparent;
  border-radius: var(--r-lg);
  background:
    var(--grad-surface) padding-box,
    var(--grad-bevel) border-box;
  box-shadow: var(--elev-1);
  padding: 1rem 1.2rem 1.2rem;
  min-width: 0;
}

.ldp-top {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.13em;
  margin-bottom: 0.8rem;
}
.ldp-top .dim { color: var(--ink-faint); }

.ldp-code {
  margin: 0;
  padding: 0.85rem 1rem;
  background: var(--sink);
  border-radius: 12px;
  box-shadow: var(--inset-2);
  font-size: 0.76rem;
  line-height: 1.8;
  color: var(--ink);
  overflow-x: auto;
}
.ln { display: block; white-space: pre; }
/* Spacer lines are empty elements (the linter self-closes them) — keep
   their line box so the plates stay row-aligned. */
.ln:empty::before { content: '\a0'; }
.ln.hl {
  background: var(--accent-dim);
  border-left: 2px solid var(--accent);
  margin-inline: -1rem;
  padding-inline: calc(1rem - 2px) 1rem;
}
.tk-c { color: var(--ink-faint); }
.tk-k { color: var(--accent-soft); }
.tk-f { color: var(--accent); font-weight: 600; }
.tk-s { color: var(--ink-dim); }

/* The 1:1 stamp — a milled disc seated between the plates. */
.ldp-bolt {
  align-self: center;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--grad-surface);
  box-shadow: var(--elev-2);
}
.ldp-bolt span {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--accent-soft);
}

.ldp-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
}
.ldp-strip-label {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  flex: none;
}
.ldp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.ldp-chip {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent-soft);
  background: var(--sink);
  border-radius: 999px;
  padding: 0.2rem 0.65rem;
  box-shadow: var(--inset-1);
}

@media (max-width: 860px) {
  .ldp-pair { grid-template-columns: minmax(0, 1fr); }
  .ldp-bolt { justify-self: center; }
}
</style>
