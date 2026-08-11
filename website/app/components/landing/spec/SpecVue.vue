<template>
  <!-- Nuxt optional, stated literally: the Vue chip holds steady while the
       Nuxt layer ghosts in and out. Reduced motion keeps both visible — the
       point still reads from the dashed border and the label. -->
  <div class="flex w-full min-w-0 flex-col items-center gap-2 font-mono">
    <div class="flex min-w-0 flex-wrap items-center justify-center gap-2">
      <span class="flex items-center gap-1.5 rounded-md border border-(--ui-border-accented) px-2 py-1 text-[0.62rem] text-highlighted">
        <UIcon
          name="i-simple-icons-vuedotjs"
          class="size-3.5 flex-none text-toned"
        />any Vue app
      </span>
      <span class="nuxt-chip flex items-center rounded-md border border-dashed border-(--ui-border-accented) px-2 py-1 text-[0.55rem] font-bold tracking-[0.1em] text-dimmed">NUXT · OPTIONAL</span>
    </div>
    <code class="etched max-w-full truncate rounded-sm px-1.5 py-0.5 text-[0.58rem] text-toned">'nuxt-convex-module/vue'</code>
  </div>
</template>

<style scoped>
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
