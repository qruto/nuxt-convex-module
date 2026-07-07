<script setup lang="ts">
// Each capability is stamped with the upstream file it ports — the kit's
// actual engineering story (see PARITY.md), not decoration.
const tiles = [
  {
    stamp: 'convex/react',
    title: 'Reactive live queries',
    body: 'useQuery, useQueries, useMutation, useAction, and cursor-based usePaginatedQuery. VueUse-shaped: ref-friendly args in, reactive results out.',
  },
  {
    stamp: 'convex/nextjs',
    title: 'SSR & preloading',
    body: 'fetchQuery, preloadQuery, and usePreloadedQuery render on the server and hydrate without a flash of loading state.',
  },
  {
    stamp: '@convex-dev/better-auth',
    title: 'Auth, opt-in',
    body: 'Install the package and useAuth, the /api/auth proxy, route middleware, and the AuthBoundary component wire themselves up.',
  },
  {
    stamp: '@convex-dev/polar',
    title: 'Billing, opt-in',
    body: 'Install the package and the CheckoutLink and CustomerPortalLink components register automatically. No extra modules, no config.',
  },
  {
    stamp: 'convex/react',
    title: 'File storage',
    body: 'useUpload, useUploadQueue, and useStorageUrl for Convex file storage — progress, queueing, and URL resolution included.',
  },
  {
    stamp: 'PARITY.md',
    title: 'Diffable with upstream',
    body: 'Every file mirrors its convex/react or convex/nextjs origin, so tracking an upstream release is a mechanical diff, not a rewrite.',
  },
]
</script>

<template>
  <section class="lo ld-sect">
    <div class="ld-inner">
      <header class="lo-head">
        <p class="ld-eyebrow etched">
          <span
            class="ld-tick"
            aria-hidden="true"
          />
          <span class="ld-index">03</span>
          LOADOUT
        </p>
        <h2 class="ld-title">
          Everything from <code class="lo-code mono">convex/react</code>, the Vue way
        </h2>
        <p class="ld-sub">
          Every part is stamped with the upstream file it ports.
        </p>
      </header>

      <ul class="lo-grid">
        <li
          v-for="tile in tiles"
          :key="tile.title"
          class="lo-tile"
        >
          <span class="lo-stamp mono etched">{{ tile.stamp }}</span>
          <h3 class="lo-tile-title">
            {{ tile.title }}
          </h3>
          <p class="lo-tile-body">
            {{ tile.body }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.lo-head { max-width: 44rem; margin-bottom: 2.4rem; }

.lo-code {
  font-size: 0.82em;
  color: var(--accent-soft);
  background: var(--sink);
  padding: 0.08em 0.4em;
  border-radius: 8px;
  box-shadow: var(--inset-1);
}

.lo-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.1rem;
}

/* A milled module: raised plate, origin stamp etched on top. */
.lo-tile {
  border: 1px solid transparent;
  border-radius: var(--r-lg);
  background:
    var(--grad-surface) padding-box,
    var(--grad-bevel) border-box;
  box-shadow: var(--elev-1);
  padding: 1.25rem 1.35rem 1.3rem;
  transition: box-shadow var(--transition), translate var(--transition);
}
.lo-tile:hover {
  box-shadow: var(--elev-2);
  translate: 0 -2px;
}

.lo-stamp {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.22rem 0.55rem;
  border-radius: 7px;
  background: var(--sink);
  box-shadow: var(--inset-1);
  margin-bottom: 0.85rem;
}

.lo-tile-title {
  font-family: var(--display);
  font-weight: 600;
  font-size: 1.08rem;
  color: var(--ink);
  margin: 0 0 0.45rem;
}

.lo-tile-body {
  font-family: var(--font);
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--ink-dim);
  margin: 0;
}

/* Scroll-entry reveal — progressive enhancement only. */
@media (prefers-reduced-motion: no-preference) {
  @supports ((animation-timeline: view()) and (animation-range: entry)) {
    @keyframes lo-tile-in {
      from { opacity: 0; transform: translateY(16px); }
    }
    .lo-tile {
      animation: lo-tile-in auto var(--ease-out) backwards;
      animation-timeline: view();
      animation-range: entry 0% entry 55%;
    }
  }
}
</style>
