<script setup lang="ts">
// The hero's signature: a machined titanium field device. The live-query
// example renders on an inset display well carved into the plate; the
// markings are the kit's real spec (model, material, baselines).
const specs = [
  { label: 'V0.1.0' },
  { label: 'MIT' },
  { label: 'NUXT ≥ 4.1' },
  { label: 'CONVEX 1.42' },
]
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
        class="dev noise"
        aria-label="A titanium field device showing a live Convex query in Vue"
      >
        <span
          class="dev-screw tl"
          aria-hidden="true"
        />
        <span
          class="dev-screw tr"
          aria-hidden="true"
        />
        <span
          class="dev-screw bl"
          aria-hidden="true"
        />
        <span
          class="dev-screw br"
          aria-hidden="true"
        />
        <span
          class="dev-grip"
          aria-hidden="true"
        />

        <header class="dev-top mono">
          <span class="dev-etch etched">NCK-01</span>
          <span class="dev-etch etched dim">TI-6AL-4V</span>
          <span class="dev-led"><i aria-hidden="true" />LIVE</span>
        </header>

        <div class="dev-screen">
          <pre class="dev-code mono"><code><span class="tk-c">// app.vue — data is live, everywhere</span>
<span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'#convex/api'</span>

<span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})
<span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</code></pre>
        </div>

        <figcaption class="dev-foot mono">
          <span class="dev-etch etched dim"><i
            class="dev-dot ok"
            aria-hidden="true"
          />WS OPEN</span>
          <span class="dev-etch etched dim">2 SUBSCRIPTIONS</span>
          <span class="dev-etch etched dim">SSR HYDRATED</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
/* ── Hero ground — brushed titanium grain + a whisper of anodize glow.
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

/* ── The device — a chamfered, milled titanium plate ──────────── */
.dev {
  position: relative;
  margin: 0;
  border: 1px solid transparent;
  border-radius: 26px;
  background:
    var(--grad-surface) padding-box,
    var(--grad-bevel) border-box;
  box-shadow: var(--elev-3);
  padding: 1.35rem 3.1rem 1.25rem 1.5rem;
  animation: dev-settle 0.7s var(--ease-out) both;
  animation-delay: 160ms;
}
@keyframes dev-settle {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Corner fasteners — recessed torx-style screws. */
.dev-screw {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 32% 28%,
    light-dark(#ffffff, #3d3d3d),
    light-dark(#c6c6c6, #0f0f0f)
  );
  box-shadow:
    inset 0 1px 2px light-dark(rgb(0 0 0 / 0.28), rgb(0 0 0 / 0.75)),
    0 1px 0 light-dark(rgb(255 255 255 / 0.85), rgb(255 255 255 / 0.06));
}
.dev-screw::before {
  content: '';
  position: absolute;
  left: 2.5px;
  right: 2.5px;
  top: 5.5px;
  height: 2px;
  border-radius: 2px;
  background: light-dark(rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.85));
  transform: rotate(45deg);
}
.dev-screw.tl { top: 10px; left: 10px; }
.dev-screw.tr { top: 10px; right: 10px; }
.dev-screw.bl { bottom: 10px; left: 10px; }
.dev-screw.br { bottom: 10px; right: 10px; }
.dev-screw.tr::before { transform: rotate(-45deg); }
.dev-screw.bl::before { transform: rotate(-45deg); }

/* Milled grip grooves along the right flank. */
.dev-grip {
  position: absolute;
  top: 2rem;
  bottom: 2rem;
  right: 1.05rem;
  width: 13px;
  border-radius: 7px;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0 5px,
    light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.55)) 5px 7px,
    light-dark(rgb(255 255 255 / 0.75), rgb(255 255 255 / 0.07)) 7px 8px
  );
}

/* Etched markings row. */
.dev-top,
.dev-foot {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.13em;
}
.dev-top { margin-bottom: 0.85rem; }
.dev-foot { margin-top: 0.8rem; flex-wrap: wrap; row-gap: 0.35rem; }
.dev-etch { color: var(--ink-dim); }
.dev-etch.dim { color: var(--ink-faint); }
.dev-foot .dev-etch { display: inline-flex; align-items: center; gap: 0.4rem; }

.dev-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dev-dot.ok { background: var(--ok); box-shadow: var(--glow-ok); }

.dev-led {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--accent-soft);
}
.dev-led i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: var(--glow-accent-soft);
  animation: pulse-ring 2.4s ease-in-out infinite;
}

/* Inset display well — the readout carved into the plate. */
.dev-screen {
  background: var(--sink);
  border-radius: 14px;
  box-shadow: var(--inset-2);
  padding: 1rem 1.15rem;
  overflow-x: auto;
}
.dev-code {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.75;
  color: var(--ink);
  white-space: pre;
}
.tk-c { color: var(--ink-faint); }
.tk-k { color: var(--accent-soft); }
.tk-f { color: var(--accent); font-weight: 600; }
.tk-s { color: var(--ink-dim); }

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .lh-inner { grid-template-columns: minmax(0, 1fr); }
  .dev { max-width: min(34rem, 100%); }
}
@media (max-width: 480px) {
  .dev { padding-right: 2.6rem; }
  .dev-top, .dev-foot { gap: 0.7rem; }
}
</style>
