<template>
  <!-- Nuxt optional, stated literally: the Vue chip holds steady while the
       Nuxt layer ghosts in and out, and the one call that provides the
       client sits in the readout beneath. Reduced motion keeps both chips visible — the
       point still reads from the dashed border and the label. -->
  <div class="flex w-full flex-col gap-3 font-mono">
    <div class="flex min-w-0 flex-wrap items-center justify-center gap-3 whitespace-nowrap">
      <span class="flex items-center gap-2 rounded-md border border-accented px-3 py-1.5 text-[0.66rem] text-highlighted">
        <UIcon
          name="i-simple-icons-vuedotjs"
          class="vue-mark size-4 flex-none"
        />any Vue app
      </span>
      <span class="nuxt-chip flex items-center rounded-md border border-dashed border-accented px-3 py-2 text-[0.56rem] font-bold tracking-[0.08em] text-dimmed">nuxt · optional</span>
    </div>
    <code class="part-well block min-w-0 truncate px-4 py-3 text-center text-[0.62rem] text-dimmed">app.provide(<span class="text-toned">ConvexClientKey</span>, client)</code>
  </div>
</template>

<style scoped>
/* Vue's own green, on each scheme's contrast floor — the steady chip is the
   Vue brand holding still while the Nuxt layer ghosts. */
.vue-mark {
  color: light-dark(oklch(58% 0.115 160), oklch(70.3% 0.132 160.4));
}
@media (prefers-reduced-motion: no-preference) {
  .nuxt-chip {
    animation: vue-optional 4.2s ease-in-out infinite;
  }
}
@keyframes vue-optional {
  0%, 38% { opacity: 1; }
  58%, 72% { opacity: 0.25; }
  92%, 100% { opacity: 1; }
}
</style>
