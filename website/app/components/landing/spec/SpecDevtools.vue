<template>
  <!-- A postage-stamp DevTools window: the Convex tab seated in the strip
       (its underline stays signal orange — it IS the Convex tab), while the
       panel's live telemetry breathes in the card's Nuxt-emerald band: LEDs,
       and log lanes shimmering underneath. Reduced motion shows the open
       panel at rest. -->
  <div class="w-full overflow-hidden rounded-lg border border-accented font-mono">
    <div class="flex items-center gap-2 border-b border-accented px-3 py-1.5 text-[0.56rem] font-bold tracking-[0.12em] text-dimmed">
      <span class="px-1">nuxt</span>
      <span class="relative px-1 text-lit">convex<i class="absolute inset-x-1 -bottom-2 h-0.5 rounded-full bg-primary" /></span>
      <span class="px-1">timeline</span>
      <i class="led ml-auto size-2 flex-none rounded-full" />
    </div>
    <div class="flex flex-col gap-2.5 px-4 py-2.5">
      <div
        v-for="(width, n) in LANES"
        :key="n"
        class="relative h-1.5 overflow-hidden rounded-full bg-(--ui-border-accented)"
        :style="{ width, '--i': n }"
      >
        <i class="shimmer absolute inset-y-0 w-1/2 rounded-full" />
      </div>
      <div class="mt-0.5 flex items-center gap-2 text-[0.56rem] font-bold tracking-widest text-dimmed">
        <i class="led size-1.5 flex-none rounded-full" /><span>3 queries live</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const LANES = ['82%', '58%', '70%']
</script>

<style scoped>
.led {
  background: var(--band, var(--color-signal-500));
  box-shadow: var(--band-glow, var(--glow-primary-soft));
}
.shimmer {
  left: -50%;
  background: linear-gradient(90deg,
    transparent,
    color-mix(in srgb, var(--band, var(--ui-text-dimmed)) 35%, transparent),
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
