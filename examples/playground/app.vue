<script setup lang="ts">
// Nothing Convex-flavoured runs in this component, on purpose. `useMutation`
// and `useConvexConnectionState` throw synchronously inside `setup()` when no
// client has been provided — and the module provides none until a deployment
// URL is configured. So the guard has to sit on a child component that is never
// instantiated before there is a URL, rather than on a branch inside one setup.
const configured = computed(() => Boolean(useRuntimeConfig().public.convex.url))
</script>

<template>
  <main class="app">
    <header class="head">
      <h1>Nuxt <span aria-hidden="true">✕</span> Convex</h1>
      <BuildBadge />
    </header>

    <ConvexSetup v-if="!configured" />
    <MessageBoard v-else />
  </main>
</template>

<style>
:root {
  color-scheme: light dark;
  --ground: #fff;
  --ink: #14171a;
  --muted: #5c6773;
  --line: #e3e7ec;
  --raised: #f6f8fa;
  --accent: #ee342f;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ground: #14171a;
    --ink: #eef1f4;
    --muted: #96a1ad;
    --line: #262c33;
    --raised: #1b2026;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}

code,
kbd {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.9em;
}

.app {
  max-width: 44rem;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 4rem;
}

.head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.75rem;
}

.head h1 {
  margin: 0;
  font-size: 1.4rem;
  letter-spacing: -0.01em;
}

.head h1 span {
  color: var(--accent);
}
</style>
