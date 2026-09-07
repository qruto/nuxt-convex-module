<template>
  <section class="setup">
    <h2>Point this at your Convex deployment</h2>
    <p>
      The app above is already wired to the build being reviewed. What it doesn't have is a
      backend — it uses <strong>yours</strong>. Nothing is hosted for you, and nothing needs
      to run Convex in this sandbox.
    </p>

    <ol>
      <li>
        <p>Create <code>.env.local</code> here with your deployment URL:</p>
        <pre><code>NUXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud</code></pre>
        <p class="note">
          The dev server watches that file, so this page becomes the live demo as soon as you
          save it — nothing to restart.
        </p>
      </li>
      <li>
        <p>
          Make sure that deployment has this app's two functions: a <code>messages</code>
          table with a <code>list</code> query and a <code>send</code> mutation. They are
          <code>convex/schema.ts</code> and <code>convex/messages.ts</code> in the file tree —
          about twenty lines together. Push them from wherever you already run Convex:
        </p>
        <pre><code>npx convex deploy</code></pre>
      </li>
    </ol>

    <p class="alt">
      Already have an app on that deployment? Point
      <code>components/MessageBoard.vue</code> at your own functions instead —
      <code>api</code> is typed from <code>convex/_generated</code>, so your editor will
      autocomplete them.
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

ol {
  margin: 1.25rem 0;
  padding-left: 1.25rem;
}

li + li {
  margin-top: 1.25rem;
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

.note {
  color: var(--muted);
  font-size: 0.88rem;
}

.alt {
  border-top: 1px solid var(--line);
  padding-top: 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
