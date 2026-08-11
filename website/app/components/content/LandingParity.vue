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
  <div>
    <div class="mb-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <article class="plate sheen min-w-0 px-5 pt-4 pb-5">
        <header class="mb-3 flex items-center gap-3 font-mono text-[0.65rem] font-semibold tracking-[0.13em]">
          <span class="etched text-toned">REACT</span>
          <span class="etched text-dimmed">convex/react</span>
        </header>
        <pre
          data-tokens
          class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] text-highlighted"
        ><code><span class="ln tk-c">// React — convex/react</span><span class="ln"><span class="tk-k">import</span> { useQuery, useMutation } <span class="tk-k">from</span> <span class="tk-s">'convex/react'</span></span><span class="ln"><span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'../convex/_generated/api'</span></span><span class="ln" /><span class="ln hl"><span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})</span><span class="ln hl"><span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</span></code></pre>
      </article>

      <!-- The 1:1 stamp — a milled disc seated between the plates. -->
      <div
        class="grid size-11 flex-none place-items-center self-center rounded-full bg-(image:--grad-surface) shadow-(--elev-2) max-md:justify-self-center"
        aria-hidden="true"
      >
        <span class="font-mono text-[0.66rem] font-bold tracking-[0.06em] text-primary-700 dark:text-primary-300">1:1</span>
      </div>

      <article class="plate sheen min-w-0 px-5 pt-4 pb-5">
        <header class="mb-3 flex items-center gap-3 font-mono text-[0.65rem] font-semibold tracking-[0.13em]">
          <span class="etched text-toned">VUE</span>
          <span class="etched text-dimmed">nuxt-convex-module</span>
        </header>
        <pre
          data-tokens
          class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] text-highlighted"
        ><code><span class="ln tk-c">// Vue — nuxt-convex-module</span><span class="ln tk-c">// composables auto-import in Nuxt</span><span class="ln"><span class="tk-k">import</span> { api } <span class="tk-k">from</span> <span class="tk-s">'#convex/api'</span></span><span class="ln" /><span class="ln hl"><span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})</span><span class="ln hl"><span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</span></code></pre>
      </article>
    </div>

    <footer class="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <span class="etched flex-none font-mono text-[0.6rem] font-semibold tracking-[0.14em] text-toned">SAME NAME · SAME SHAPE</span>
      <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
        <li
          v-for="name in sameNames"
          :key="name"
          class="rounded-full bg-muted px-2.5 py-1 font-mono text-[0.7rem] font-semibold text-primary-700 shadow-(--inset-1) dark:text-primary-300"
        >
          {{ name }}
        </li>
      </ul>
    </footer>
  </div>
</template>

<style scoped>
/* Hand-tokenized lines: dozens of spans per plate — per-line utility
   strings would be unreadable, so the three line rules stay CSS. */
.ln {
  display: block;
  white-space: pre;
}

/* Spacer lines are empty elements (the linter self-closes them) — keep
   their line box so the plates stay row-aligned. */
.ln:empty::before {
  content: '\a0';
}

.ln.hl {
  background: light-dark(
    color-mix(in srgb, var(--ui-color-primary-600) 12%, transparent),
    color-mix(in srgb, var(--ui-color-primary-500) 20%, transparent)
  );
  border-left: 2px solid var(--ui-primary);
  margin-inline: -1rem;
  padding-inline: calc(1rem - 2px) 1rem;
}
</style>
