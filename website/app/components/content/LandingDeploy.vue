<script setup lang="ts">
// The deployment tray: a case-foam cutout (recessed well) with each step
// seated in it like a tool. Steps are the real ones from the install guide.
const steps = [
  {
    id: 'MODULE',
    cmd: 'npx nuxi module add nuxt-convex-module',
    note: 'One module. Composables, components, and server helpers auto-import.',
  },
  {
    id: 'DEPLOY',
    cmd: 'NUXT_PUBLIC_CONVEX_URL=https://…',
    note: 'Point it at your Convex deployment from .env.',
  },
  {
    id: 'RUN',
    cmd: 'npx convex dev',
    note: 'Run Convex beside Nuxt and read live data with useQuery.',
  },
]
</script>

<template>
  <section class="dp">
    <div class="ld-inner dp-inner">
      <header class="dp-head">
        <p class="ld-eyebrow etched">
          <span
            class="ld-tick"
            aria-hidden="true"
          />
          <span class="ld-index">04</span>
          DEPLOYMENT
        </p>
        <h2 class="ld-title">
          In your pocket in three moves
        </h2>
      </header>

      <ol class="dp-tray">
        <li
          v-for="step in steps"
          :key="step.id"
          class="dp-step"
        >
          <span class="dp-id mono etched">{{ step.id }}</span>
          <code class="dp-cmd mono">{{ step.cmd }}</code>
          <p class="dp-note">
            {{ step.note }}
          </p>
        </li>
      </ol>

      <div class="dp-cta">
        <NuxtLink
          to="/getting-started/installation"
          class="btn primary dp-btn"
        >
          Install the kit
          <span aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink
          to="/playground"
          class="btn dp-btn"
        >
          Try the live playground
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dp-inner { padding-bottom: clamp(4rem, 10vh, 6rem); }

.dp-head { margin-bottom: 2rem; }

/* The case-foam tray — a well carved into the ground itself. */
.dp-tray {
  list-style: none;
  margin: 0 0 2.2rem;
  padding: 1.1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1.1rem;
  background: var(--sink);
  border-radius: var(--r-lg);
  box-shadow: var(--inset-2);
}

/* Each step sits in the foam like a tool. */
.dp-step {
  background: var(--grad-surface);
  border-radius: var(--r);
  box-shadow: var(--elev-1);
  padding: 1.15rem 1.25rem 1.2rem;
}

.dp-id {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin-bottom: 0.75rem;
}
.dp-id::after {
  content: '';
  display: block;
  width: 100%;
  height: 2px;
  margin-top: 0.3rem;
  border-radius: 1px;
  background: var(--accent);
  opacity: 0.85;
}

.dp-cmd {
  display: block;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--ink);
  background: var(--sink);
  border-radius: 10px;
  box-shadow: var(--inset-1);
  padding: 0.55rem 0.75rem;
  margin-bottom: 0.7rem;
  overflow-x: auto;
  white-space: nowrap;
}

.dp-note {
  font-family: var(--font);
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--ink-dim);
  margin: 0;
}

.dp-cta { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.dp-btn { padding: 0.65rem 1.25rem; font-size: 0.95rem; }
</style>
