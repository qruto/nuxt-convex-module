<script setup lang="ts">
// The starter's welcome page: replace it with your app. The Convex part to
// copy from is `components/Messages.vue`.

// Convex composables need a deployment URL, which `convex dev` provides.
// Without one, the board explains how to connect instead of failing the page.
const connected = Boolean(useRuntimeConfig().public.convex.url)

// The logo's groove runs a bead for each send and each update.
const sent = ref(0)
const received = ref(0)

const links = [
  { title: 'Nuxt', text: 'Pages, routing and server routes', href: 'https://nuxt.com/docs' },
  { title: 'Convex', text: 'Schemas, queries and mutations', href: 'https://docs.convex.dev' },
  { title: 'nuxt-convex-module', text: 'Composables, auth and file storage', href: 'https://nuxt-convex-module.dev' },
  { title: 'Convex dashboard', text: 'Your data, logs and functions', href: 'https://dashboard.convex.dev' },
]
</script>

<template>
  <NuxtRouteAnnouncer />
  <main class="page">
    <header class="intro">
      <Logos :sent="sent" :received="received" />
      <h1 class="concave-text">
        Nuxt + Convex
      </h1>
      <p>Pages render on the server, and Convex keeps their data live in every open tab.</p>
    </header>

    <section class="board convex">
      <Messages v-if="connected" @sent="sent++" @received="received++" />
      <div v-else class="connect">
        <h2>Connect a Convex deployment</h2>
        <p>
          This app has no deployment URL yet. Start it with the <code>dev</code> script
          (<code>npm run dev</code>, <code>pnpm dev</code>, …): <code>convex dev</code> sets up a
          deployment (a local one needs no account), pushes <code>convex/</code> and starts Nuxt
          beside it.
        </p>
        <p>Serving a build? Set <code>NUXT_PUBLIC_CONVEX_URL</code> where it runs.</p>
      </div>
    </section>

    <section class="steps">
      <h2>Make it yours</h2>
      <ol>
        <li>
          <code class="concave">convex/schema.ts</code>
          <span>Your tables and their fields.</span>
        </li>
        <li>
          <code class="concave">convex/messages.ts</code>
          <span>Queries and mutations. Saving a file pushes it to your deployment.</span>
        </li>
        <li>
          <code class="concave">app/app.vue</code>
          <span>This page. Replace it with your own.</span>
        </li>
      </ol>
    </section>

    <nav class="links" aria-label="Documentation">
      <a
        v-for="link in links"
        :key="link.href"
        class="convex"
        :href="link.href"
        target="_blank"
        rel="noopener"
      >
        <strong>{{ link.title }}</strong>
        <span>{{ link.text }}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5 11 11 5M6 5h5v5" />
        </svg>
      </a>
    </nav>
  </main>
</template>

<style scoped>
.page {
  display: grid;
  gap: 2.5rem;
  max-width: 36rem;
  margin: 0 auto;
  padding: clamp(2.5rem, 9vh, 5rem) 1rem 3rem;
}

.intro {
  display: grid;
  gap: 1.25rem;
  justify-items: center;
  text-align: center;
}

.intro h1 {
  margin-top: 0.5rem;
  font-size: clamp(2.5rem, 9vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.025em;
}

.intro p {
  max-width: 24rem;
  color: var(--text-muted);
  font-size: 1.05rem;
}

.board {
  padding: 1rem;
  border-radius: var(--radius-card);
}

.connect {
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem;
}

.connect h2 {
  font-size: 1.125rem;
}

.connect p {
  color: var(--text-muted);
}

.steps {
  display: grid;
  gap: 1rem;
  padding-inline: 0.5rem;
}

.steps h2 {
  font-size: 1.125rem;
}

/* One column of file names, one of what they hold. */
.steps ol {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.875rem 1rem;
  align-items: baseline;
  margin: 0;
  padding: 0;
  list-style: none;
}

.steps li {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: baseline;
}

@media (width < 30rem) {
  .steps ol {
    grid-template-columns: 1fr;
  }

  .steps li {
    gap: 0.375rem;
    justify-items: start;
  }
}

.steps code {
  justify-self: start;
  padding: 0.2rem 0.55rem;
  border-radius: 0.5rem;
  color: var(--text-strong);
}

.steps span {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.75rem;
}

.links a {
  position: relative;
  display: grid;
  gap: 0.15rem;
  align-content: start;
  padding: 0.9rem 2.5rem 0.9rem 1rem;
  border-radius: 1rem;
  color: var(--text-strong);
  text-decoration: none;
}

.links span {
  color: var(--text-muted);
  font-size: 0.875rem;
}

.links svg {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 1rem;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke 150ms, translate 150ms;
}

.links a:hover svg {
  stroke: var(--accent);
  translate: 1px -1px;
}
</style>
