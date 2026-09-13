<template>
  <!-- The editor moment the types buy you: `api.` with the deployment's own
       functions in the completion menu — each with the kind the types
       know it to be — the highlight walking the entries and a ghost
       completion after the dot tracking whichever entry is lit —
       TypeScript's own azure. The menu hangs under the caret the way an
       editor's does. Reduced motion parks the highlight (and ghost) on
       the first entry. -->
  <div class="mx-auto w-full max-w-64 font-mono">
    <div class="flex items-center px-1 text-[0.72rem] text-highlighted">
      <span class="text-toned">api</span><span class="text-dimmed">.</span><i class="caret ml-px inline-block h-[1em] w-2 rounded-[1px]" /><span class="ml-1 grid min-w-0 text-dimmed">
        <span
          v-for="(item, i) in ITEMS"
          :key="item.name"
          class="ghost truncate italic opacity-0 [grid-area:1/1]"
          :style="{ '--i': i }"
        >{{ item.name }}</span>
      </span>
    </div>
    <div class="relative mt-1.5 ml-8 overflow-hidden rounded-md border border-accented py-1 text-[0.62rem]">
      <i class="hl absolute inset-x-1 top-1 h-5 rounded-[4px]" />
      <div
        v-for="item in ITEMS"
        :key="item.name"
        class="relative flex items-center justify-between gap-4 px-3 leading-5 text-toned"
      >
        <span class="truncate">{{ item.name }}</span>
        <span class="flex-none text-[0.52rem] leading-5 text-dimmed">{{ item.kind }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ITEMS = [
  { name: 'messages.list', kind: 'query' },
  { name: 'messages.send', kind: 'mutation' },
  { name: 'files.upload', kind: 'action' },
]
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
/* The highlight is one row tall, so it steps by its OWN height — not by
   a rem: the stage zooms the art, and Chrome scales the rows' layout
   but not a rem inside an animated translate, which left the highlight
   a third of a row short on every step (2026-09-12). */
@keyframes typed-cycle {
  0%, 32.9% { translate: 0 0; }
  33%, 65.9% { translate: 0 100%; }
  66%, 99.9% { translate: 0 200%; }
  100% { translate: 0 0; }
}
/* Each ghost owns one third of the cycle (the delay walks the slots). */
@keyframes typed-ghost {
  0%, 1% { opacity: 0; }
  4%, 30% { opacity: 0.85; }
  33%, 100% { opacity: 0; }
}
</style>
