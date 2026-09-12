<template>
  <!-- The parity claim: ONE line of code, and the package it comes from
       flipping between Convex's own React entry and this module — the
       call never changes, only the import does. Nothing of React's is
       drawn; the point is the line surviving the swap. Reduced motion
       shows the Vue import. -->
  <div class="flex w-full max-w-64 flex-col items-stretch gap-2 font-mono">
    <div class="grid h-4 text-[0.58rem] text-dimmed">
      <span class="from from-react truncate [grid-area:1/1]">from <span class="text-toned">'convex/react'</span></span>
      <span class="from from-vue truncate [grid-area:1/1]">from <span class="text-toned">'nuxt-convex-module/vue'</span></span>
    </div>
    <div class="part-well flex items-center gap-2 px-3 py-2 text-[0.7rem] text-highlighted">
      <UIcon
        name="i-simple-icons-vuedotjs"
        class="vue size-3.5 flex-none"
        aria-hidden="true"
      />
      <code class="truncate">useQuery(api.messages.list)</code>
      <span
        class="same ml-auto flex-none text-[0.52rem] font-bold"
        aria-hidden="true"
      >same</span>
    </div>
  </div>
</template>

<style scoped>
.vue {
  color: light-dark(oklch(58% 0.115 160), oklch(70.3% 0.132 160.4));
}
.same {
  color: var(--band, var(--color-signal-500));
}
.from-react { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .from-react { animation: parity-react 5.2s ease-in-out infinite; }
  .from-vue { animation: parity-vue 5.2s ease-in-out infinite; }
  .same { animation: parity-same 5.2s ease-in-out infinite; }
}
/* The two imports never share a frame: react is fully out before vue
   comes in, and back again at the end of the cycle. */
@keyframes parity-react {
  0%, 36% { opacity: 1; translate: 0 0; }
  42%, 92% { opacity: 0; translate: 0 -4px; }
  98%, 100% { opacity: 1; translate: 0 0; }
}
@keyframes parity-vue {
  0%, 44% { opacity: 0; translate: 0 4px; }
  50%, 88% { opacity: 1; translate: 0 0; }
  94%, 100% { opacity: 0; translate: 0 4px; }
}
@keyframes parity-same {
  0%, 44% { opacity: 0; }
  52%, 92% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
