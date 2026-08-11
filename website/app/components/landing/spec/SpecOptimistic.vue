<template>
  <!-- One write, two frames in the same slot: the dashed LOCAL render the
       instant you call send, then the committed row wearing its round-trip
       chip. Reduced motion shows the committed row. -->
  <div class="grid w-full max-w-48 font-mono text-[0.64rem]">
    <div class="row-local flex min-w-0 items-center gap-2 rounded-md border border-dashed border-(--color-signal-500)/60 px-2 py-1.5 [grid-area:1/1]">
      <span class="flex-none text-[0.52rem] font-bold tracking-[0.1em] text-primary-700 dark:text-primary-300">LOCAL</span>
      <span class="min-w-0 truncate text-toned">hi, realtime</span>
    </div>
    <div class="row-db flex min-w-0 items-center gap-2 rounded-md border border-(--ui-border-accented) px-2 py-1.5 [grid-area:1/1]">
      <span class="flex-none text-[0.52rem] font-bold tracking-[0.1em] text-dimmed">DB</span>
      <span class="min-w-0 truncate text-default">hi, realtime</span>
      <span class="ms ml-auto flex-none text-[0.52rem] font-bold tracking-[0.08em] text-primary-700 dark:text-primary-300">42 MS</span>
    </div>
  </div>
</template>

<style scoped>
.row-local {
  opacity: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .row-local { animation: opt-local 4.4s ease-in-out infinite; }
  .row-db { animation: opt-db 4.4s ease-in-out infinite; }
  .ms { animation: opt-ms 4.4s ease-in-out infinite; }
}
@keyframes opt-local {
  0%, 6% { opacity: 0; translate: 0 4px; }
  12%, 42% { opacity: 1; translate: 0 0; }
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
