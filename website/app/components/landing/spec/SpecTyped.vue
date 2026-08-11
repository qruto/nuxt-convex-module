<template>
  <!-- The editor moment the types buy you: `api.` and the deployment's own
       functions in the completion menu, the highlight walking the entries.
       Reduced motion parks the highlight on the first entry. -->
  <div class="w-full max-w-44 font-mono">
    <div class="flex items-center text-[0.68rem] text-highlighted">
      <span class="text-toned">api</span><span class="text-dimmed">.</span><i class="caret ml-px inline-block h-[1em] w-2 rounded-[1px]" />
    </div>
    <div class="relative mt-1 overflow-hidden rounded-md border border-(--ui-border-accented) py-0.5 text-[0.6rem]">
      <i class="hl absolute inset-x-0.5 top-0.5 h-4.5 rounded-[4px]" />
      <div
        v-for="item in ['messages.list', 'messages.send', 'files.upload']"
        :key="item"
        class="relative px-2 leading-[1.125rem] text-toned"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.caret {
  background: var(--color-signal-500);
}
.hl {
  background: color-mix(in srgb, var(--color-signal-500) 14%, transparent);
}
@media (prefers-reduced-motion: no-preference) {
  /* demo-caret-blink lives in app.css — same blink as the hero's caret. */
  .caret {
    animation: demo-caret-blink 1.1s linear infinite;
  }
  .hl {
    animation: typed-cycle 3.9s linear infinite;
  }
}
@keyframes typed-cycle {
  0%, 32.9% { translate: 0 0; }
  33%, 65.9% { translate: 0 1.125rem; }
  66%, 99.9% { translate: 0 2.25rem; }
  100% { translate: 0 0; }
}
</style>
