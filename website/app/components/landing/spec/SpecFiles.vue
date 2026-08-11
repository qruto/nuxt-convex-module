<template>
  <!-- `useUpload` in three beats: the file, the progress ref filling, the
       storage ID landing. Reduced motion shows the finished upload. -->
  <div class="flex w-full max-w-48 flex-col gap-2 font-mono">
    <div class="flex min-w-0 items-center gap-2 text-[0.62rem] text-toned">
      <UIcon
        name="i-lucide-file-up"
        class="size-3.5 flex-none text-dimmed"
      />
      <span class="min-w-0 truncate">schematic.png</span>
      <span class="ml-auto flex-none text-[0.55rem] text-dimmed">84 KB</span>
    </div>
    <span class="h-1.5 w-full overflow-hidden rounded-full bg-(--ui-border-accented)"><i class="fill block h-full rounded-full" /></span>
    <code class="sid etched self-start rounded-sm px-1.5 py-0.5 text-[0.56rem] text-highlighted">id kg24d8mn…9d1</code>
  </div>
</template>

<style scoped>
.fill {
  width: 100%;
  background: var(--color-signal-500);
}
@media (prefers-reduced-motion: no-preference) {
  .fill { animation: files-fill 4.8s ease-in-out infinite; }
  .sid { animation: files-sid 4.8s ease-in-out infinite; }
}
@keyframes files-fill {
  0%, 8% { width: 0%; }
  58% { width: 100%; }
  100% { width: 100%; }
}
@keyframes files-sid {
  0%, 60% { opacity: 0; translate: 0 3px; }
  68%, 100% { opacity: 1; translate: 0 0; }
}
</style>
