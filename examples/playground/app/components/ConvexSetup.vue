<template>
  <section class="setup convex">
    <h2><ConcaveText>Connect a Convex deployment</ConcaveText></h2>
    <p>
      This app has no deployment URL yet. It runs against a Convex deployment of
      <strong>yours</strong>; nothing is hosted for you.
    </p>
    <p>
      Start it with <code>npm run dev</code>. That runs <code>convex dev</code>, which logs you
      in, creates a dev deployment, pushes this app's functions from <code>convex/</code> and
      starts Nuxt beside it.
    </p>
    <pre class="concave"><code>npm run dev</code></pre>
    <p class="hint">
      Serving a build? Set <code>NUXT_PUBLIC_CONVEX_URL</code> to your deployment URL where it
      runs.
    </p>
  </section>
</template>

<style scoped>
.setup {
  display: grid;
  gap: 0.75rem;
  max-width: 40rem;
  padding: 1.5rem;
  border-radius: var(--radius-card);
}

h2 {
  font-size: 1.5rem;
}

pre {
  margin: 0;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  border-radius: var(--radius-recess);
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
