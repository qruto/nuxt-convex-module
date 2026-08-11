<template>
  <!-- A postage-stamp DevTools window: the Convex tab seated in the strip,
       live-query LED breathing, log lines shimmering underneath. Reduced
       motion shows the open panel at rest. -->
  <div class="w-full max-w-48 overflow-hidden rounded-lg border border-(--ui-border-accented)">
    <div class="flex items-center gap-1 border-b border-(--ui-border-accented) px-2 py-1 font-mono text-[0.5rem] font-bold tracking-[0.12em] text-dimmed">
      <span class="px-1">NUXT</span>
      <span class="relative px-1 text-primary-700 dark:text-primary-300">CONVEX<i class="absolute inset-x-1 -bottom-[3px] h-0.5 rounded-full bg-primary" /></span>
      <span class="px-1">TIMELINE</span>
      <i class="led ml-auto size-1.5 flex-none rounded-full" />
    </div>
    <div class="flex flex-col gap-1.5 p-2">
      <div
        v-for="n in 2"
        :key="n"
        class="relative h-1.5 overflow-hidden rounded-full bg-(--ui-border-accented)"
        :style="{ 'width': n === 1 ? '82%' : '58%', '--i': n - 1 }"
      >
        <i class="shimmer absolute inset-y-0 w-1/2 rounded-full" />
      </div>
      <div class="mt-0.5 flex items-center gap-1.5 font-mono text-[0.5rem] font-bold tracking-[0.1em] text-dimmed">
        <i class="led size-1 flex-none rounded-full" /><span>3 QUERIES LIVE</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.led {
  background: var(--color-signal-500);
  box-shadow: var(--glow-primary-soft);
}
.shimmer {
  left: -50%;
  background: linear-gradient(90deg,
    transparent,
    color-mix(in srgb, var(--ui-text-dimmed) 30%, transparent),
    transparent);
}
@media (prefers-reduced-motion: no-preference) {
  .led {
    animation: devtools-led 2.4s ease-in-out infinite;
  }
  .shimmer {
    animation: devtools-shimmer 2.8s ease-in-out infinite;
    animation-delay: calc(var(--i, 0) * 0.5s);
  }
}
@keyframes devtools-led {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@keyframes devtools-shimmer {
  0%, 15% { left: -50%; }
  70%, 100% { left: 100%; }
}
</style>
