<template>
  <section class="setup">
    <h2>Connect a Convex deployment</h2>
    <p>
      This app has no deployment URL yet. It runs against a Convex deployment of
      <strong>yours</strong>; nothing is hosted for you.
    </p>
    <p>
      Start it with <code>npm run dev</code>. That runs <code>convex dev</code>, which logs you
      in, creates a dev deployment, pushes this app's functions from <code>convex/</code> and
      starts Nuxt beside it.
    </p>
    <pre><code>npm run dev</code></pre>
    <p class="alt">
      Serving a build? Set <code>NUXT_PUBLIC_CONVEX_URL</code> to your deployment URL where it
      runs.
    </p>
  </section>
</template>

<style scoped>
.setup {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--raised);
  padding: 1.5rem;
}

h2 {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}

p {
  margin: 0.5rem 0;
}

pre {
  margin: 0.5rem 0;
  padding: 0.6rem 0.8rem;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--ground);
}

.alt {
  border-top: 1px solid var(--line);
  padding-top: 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
