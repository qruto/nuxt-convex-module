<template>
  <!-- The editor moment the types buy you: `api.` with the deployment's own
       functions in the completion menu, the highlight walking the entries and
       a ghost completion after the dot tracking whichever entry is lit —
       TypeScript's own azure. Reduced motion parks the highlight (and ghost)
       on the first entry. -->
  <div class="w-full max-w-44 font-mono">
    <div class="flex items-center text-[0.68rem] text-highlighted">
      <span class="text-toned">api</span><span class="text-dimmed">.</span><i class="caret ml-px inline-block h-[1em] w-2 rounded-[1px]" /><span class="ml-1 grid min-w-0 text-dimmed">
        <span
          v-for="(item, i) in ITEMS"
          :key="item"
          class="ghost truncate italic opacity-0 [grid-area:1/1]"
          :style="{ '--i': i }"
        >{{ item }}</span>
      </span>
    </div>
    <div class="relative mt-1 overflow-hidden rounded-md border border-accented py-0.5 text-[0.6rem]">
      <i class="hl absolute inset-x-0.5 top-0.5 h-4.5 rounded-[4px]" />
      <div
        v-for="item in ITEMS"
        :key="item"
        class="relative px-2 leading-4.5 text-toned"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ITEMS = ['messages.list', 'messages.send', 'files.upload']
</script>

<style scoped>
.caret {
  background: var(--band, var(--color-signal-500));
}
.hl {
  background: var(--band-soft, color-mix(in srgb, var(--color-signal-500) 14%, transparent));
}
/* No-motion resting state: the first entry's ghost stays visible, matching
   the parked highlight. The animation overrides this while it runs. */
.ghost:first-child {
  opacity: 0.85;
}
@media (prefers-reduced-motion: no-preference) {
  /* demo-caret-blink lives in app.css — same blink as the hero's caret. */
  .caret {
    animation: demo-caret-blink 1.1s linear infinite;
  }
  .hl {
    animation: typed-cycle 3.9s linear infinite;
  }
  .ghost {
    animation: typed-ghost 3.9s linear infinite;
    animation-delay: calc(var(--i) * 1.3s);
  }
}
@keyframes typed-cycle {
  0%, 32.9% { translate: 0 0; }
  33%, 65.9% { translate: 0 1.125rem; }
  66%, 99.9% { translate: 0 2.25rem; }
  100% { translate: 0 0; }
}
/* Each ghost owns one third of the cycle (the delay walks the slots). */
@keyframes typed-ghost {
  0%, 1% { opacity: 0; }
  4%, 30% { opacity: 0.85; }
  33%, 100% { opacity: 0; }
}
</style>
