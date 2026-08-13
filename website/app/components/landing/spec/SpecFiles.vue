<template>
  <!-- `useUpload` in three beats: the file, the progress ref filling teal,
       the storage ID stamping in as the icon flips to a check. Reduced
       motion shows the finished upload — check, full bar, ID. -->
  <div class="flex w-full max-w-48 flex-col gap-2 font-mono">
    <div class="flex min-w-0 items-center gap-2 text-[0.62rem] text-toned">
      <span class="relative grid size-3.5 flex-none place-items-center">
        <UIcon
          name="i-lucide-file-up"
          class="ico-up size-3.5 text-dimmed [grid-area:1/1]"
        />
        <UIcon
          name="i-lucide-circle-check"
          class="ico-done size-3.5 [grid-area:1/1]"
        />
      </span>
      <span class="min-w-0 truncate">schematic.png</span>
      <span class="ml-auto flex-none text-[0.55rem] text-dimmed">84 KB</span>
    </div>
    <span class="h-1.5 w-full overflow-hidden rounded-full bg-(--ui-border-accented)"><i class="fill block h-full rounded-full" /></span>
    <code class="sid etched self-start rounded-sm px-1.5 py-0.5 text-[0.56rem] text-highlighted">id kg24d8mn…9d1</code>
  </div>
</template>

<style scoped>
/* The ref's value, made visible: a teal fill whose head runs brighter than
   its tail — mixed in oklab so the tint stays luminous, not chalky. */
.fill {
  width: 100%;
  background: linear-gradient(90deg,
    var(--band, var(--color-signal-500)),
    color-mix(in oklab, var(--band, var(--color-signal-500)), #fff 22%));
}
.ico-up {
  opacity: 0;
}
.ico-done {
  color: var(--band, var(--color-signal-500));
}
@media (prefers-reduced-motion: no-preference) {
  .fill { animation: files-fill 4.8s ease-in-out infinite; }
  .sid { animation: files-sid 4.8s ease-in-out infinite; }
  .ico-up { animation: files-up 4.8s ease-in-out infinite; }
  .ico-done { animation: files-done 4.8s ease-in-out infinite; }
}
@keyframes files-fill {
  0%, 8% { width: 0%; }
  58% { width: 100%; }
  100% { width: 100%; }
}
/* The ID stamps — a press, not a fade-up: scale settles as it lands. */
@keyframes files-sid {
  0%, 60% { opacity: 0; scale: 0.92; }
  68%, 100% { opacity: 1; scale: 1; }
}
@keyframes files-up {
  0%, 60% { opacity: 1; }
  64%, 100% { opacity: 0; }
}
@keyframes files-done {
  0%, 60% { opacity: 0; }
  64%, 100% { opacity: 1; }
}
</style>
