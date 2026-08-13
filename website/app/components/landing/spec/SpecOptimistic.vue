<template>
  <!-- One write, two frames in the same slot, each wearing its timestamp:
       the dashed magenta LOCAL render stamped 0 MS the instant you call
       send, then the committed row wearing the success-green round-trip
       check. Speculative magenta -> confirmed green is the whole optimistic
       contract in two chips. Reduced motion shows the committed row. -->
  <div class="grid w-full max-w-48 font-mono text-[0.64rem]">
    <div class="row-local flex min-w-0 items-center gap-2 rounded-md border border-dashed px-2 py-1.5 [grid-area:1/1]">
      <span class="tag-local flex-none text-[0.52rem] font-bold tracking-widest">LOCAL</span>
      <span class="min-w-0 truncate text-toned">hi, realtime</span>
      <span class="tag-local ml-auto flex-none text-[0.52rem] font-bold tracking-[0.08em]">0 MS</span>
    </div>
    <div class="row-db flex min-w-0 items-center gap-2 rounded-md border border-accented px-2 py-1.5 [grid-area:1/1]">
      <span class="flex-none text-[0.52rem] font-bold tracking-widest text-dimmed">DB</span>
      <span class="min-w-0 truncate text-default">hi, realtime</span>
      <span class="ms ml-auto flex-none text-[0.52rem] font-bold tracking-[0.08em]">✓ 42 MS</span>
    </div>
  </div>
</template>

<style scoped>
.row-local {
  opacity: 0;
  border-color: color-mix(in srgb, var(--band, var(--color-signal-500)) 60%, transparent);
}
.tag-local {
  color: var(--band, var(--color-signal-500));
}
.ms {
  color: light-dark(var(--ui-color-success-600), var(--ui-color-success-400));
}
@media (prefers-reduced-motion: no-preference) {
  /* The local frame POPS — 300ms from call to paint is the pitch, so its
     entrance is the fastest move on the whole plate. */
  .row-local { animation: opt-local 4.4s cubic-bezier(0.2, 1.4, 0.4, 1) infinite; }
  .row-db { animation: opt-db 4.4s ease-in-out infinite; }
  .ms { animation: opt-ms 4.4s ease-in-out infinite; }
}
@keyframes opt-local {
  0%, 2% { opacity: 0; translate: 0 5px; }
  5%, 42% { opacity: 1; translate: 0 0; }
  50%, 100% { opacity: 0; translate: 0 0; }
}
@keyframes opt-db {
  0%, 44% { opacity: 0; }
  52%, 90% { opacity: 1; }
  97%, 100% { opacity: 0; }
}
@keyframes opt-ms {
  0%, 56% { opacity: 0; }
  64%, 90% { opacity: 1; }
  97%, 100% { opacity: 0; }
}
</style>
