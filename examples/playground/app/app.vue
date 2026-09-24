<script setup lang="ts">
// Nothing Convex-flavoured runs in this component, on purpose. The module
// provides no client until a deployment URL is configured, and every Convex
// composable throws inside `setup()` without one. So the demos sit in a child
// component that is never created before there is a URL.
const configured = computed(() => Boolean(useRuntimeConfig().public.convex.url))
</script>

<template>
  <NuxtRouteAnnouncer />
  <div class="page">
    <header class="header">
      <a class="brand" href="https://nuxt-convex-module.dev">
        <img src="/logo.svg" alt="" width="36" height="30">
        <span>nuxt-convex-module</span>
      </a>
      <BuildBadge />
    </header>

    <main>
      <section class="intro">
        <h1>Playground</h1>
        <p>
          Each card runs one part of the module against your Convex deployment. Open this page in
          a second tab: every number and list updates in both.
        </p>
      </section>

      <DemoBoard v-if="configured" />
      <ConvexSetup v-else />
    </main>

    <footer class="footer">
      <a href="https://nuxt-convex-module.dev">Documentation</a>
      <a href="https://github.com/qruto/nuxt-convex-module">GitHub</a>
      <a href="https://dashboard.convex.dev">Convex dashboard</a>
    </footer>
  </div>
</template>

<style scoped>
.page {
  max-width: 64rem;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
}

.header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
  color: var(--text-strong);
  font: 600 0.95rem var(--font-mono);
  text-decoration: none;
}

.intro {
  display: grid;
  gap: 0.5rem;
  max-width: 40rem;
  margin: 2.5rem 0 1.75rem;
}

.intro h1 {
  font-size: clamp(2.25rem, 7vw, 3.5rem);
  line-height: 1;
  letter-spacing: -0.01em;
}

.intro p {
  color: var(--text-muted);
}

.footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-top: 3rem;
  font: 0.8rem var(--font-mono);
}

.footer a {
  color: var(--text-muted);
  text-decoration: none;
}

.footer a:hover {
  color: var(--accent);
}
</style>
