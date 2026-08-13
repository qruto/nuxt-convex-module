<template>
  <!-- The no-flash story: the document arrives with its rows already in the
       HTML (the bars never blink in), then the hydrate sweep passes and the
       same bars go live IN ITS WAKE — each row tints as the sweep crosses it,
       no layout change. Hydration wears the cyan band. Reduced motion shows
       the served document, which is exactly what SSR delivers. -->
  <div class="flex w-full max-w-52 items-center gap-3">
    <div class="relative min-w-0 flex-1 overflow-hidden rounded-md border border-accented p-2">
      <div class="mb-1.5 flex items-center justify-between font-mono text-[0.5rem] font-bold tracking-[0.14em] text-dimmed">
        <span>HTML</span>
        <i class="led size-1.5 rounded-full" />
      </div>
      <div class="flex flex-col gap-1">
        <i
          v-for="n in 3"
          :key="n"
          class="bar h-1 rounded-full"
          :style="{ 'width': `${96 - n * 16}%`, '--i': n - 1 }"
        />
      </div>
      <i class="sweep pointer-events-none absolute inset-y-0 w-8" />
    </div>
    <div class="flex flex-none flex-col items-center gap-1 font-mono text-[0.5rem] font-bold tracking-[0.14em] text-dimmed">
      <UIcon
        name="i-lucide-zap"
        class="bolt size-3.5"
      />
      <span>HYDRATE</span>
    </div>
  </div>
</template>

<style scoped>
.bar {
  background: var(--ui-text-dimmed);
  opacity: 0.5;
}
.led {
  background: var(--ui-text-dimmed);
}
.sweep {
  left: -25%;
  opacity: 0;
  background: linear-gradient(90deg,
    transparent,
    color-mix(in srgb, var(--band, var(--color-signal-500)) 40%, transparent),
    transparent);
}
.bolt {
  color: var(--ui-text-dimmed);
}
@media (prefers-reduced-motion: no-preference) {
  .sweep { animation: ssr-sweep 4.6s ease-in-out infinite; }
  /* Rows relight in the sweep's wake — the stagger tracks its crossing. */
  .bar {
    animation: ssr-bar 4.6s ease-in-out infinite;
    animation-delay: calc(var(--i, 0) * 0.14s);
  }
  .led { animation: ssr-led 4.6s ease-in-out infinite; }
  .bolt { animation: ssr-bolt 4.6s ease-in-out infinite; }
}
@keyframes ssr-sweep {
  0%, 30% { left: -25%; opacity: 0; }
  36% { opacity: 1; }
  54% { left: 110%; opacity: 1; }
  58%, 100% { left: 110%; opacity: 0; }
}
@keyframes ssr-bar {
  0%, 36% { background: var(--ui-text-dimmed); opacity: 0.5; }
  46%, 84% { background: var(--band, var(--color-signal-400)); opacity: 0.9; }
  94%, 100% { background: var(--ui-text-dimmed); opacity: 0.5; }
}
@keyframes ssr-led {
  0%, 44% { background: var(--ui-text-dimmed); box-shadow: none; }
  56%, 88% { background: var(--band, var(--color-signal-500)); box-shadow: var(--band-glow, var(--glow-primary-soft)); }
  98%, 100% { background: var(--ui-text-dimmed); box-shadow: none; }
}
@keyframes ssr-bolt {
  0%, 44% { color: var(--ui-text-dimmed); }
  56%, 88% { color: var(--band, var(--color-signal-500)); }
  98%, 100% { color: var(--ui-text-dimmed); }
}
</style>
