<template>
  <!-- What useAsyncQuery does, as three stations on a line: the SERVER
       runs the query and writes the rows into the HTML, the PAYLOAD
       carries them to the browser (the rows are already there — nothing
       blinks in), and the SOCKET takes over the same rows live. The pulse
       walks the line; each station lights as it arrives. Reduced motion
       shows the finished, live document. -->
  <div class="flex w-full max-w-64 flex-col gap-3 font-mono">
    <div class="relative flex items-center justify-between">
      <i class="line absolute inset-x-3 top-1/2 h-px -translate-y-1/2" />
      <i class="pulse absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full" />
      <span
        v-for="(station, i) in STATIONS"
        :key="station"
        class="station relative flex flex-col items-center gap-1.5"
        :style="{ '--i': i }"
      >
        <i class="led size-2 rounded-full" />
        <span class="text-[0.52rem] text-dimmed">{{ station }}</span>
      </span>
    </div>
    <div class="part-well flex flex-col gap-1.5 px-3 py-2.5">
      <div class="flex items-center justify-between text-[0.5rem] text-dimmed">
        <span>&lt;ul&gt;</span>
        <span class="state state-html [grid-area:1/1]">in the html</span>
        <span class="state state-live absolute right-3">live</span>
      </div>
      <i
        v-for="n in 3"
        :key="n"
        class="bar h-1 rounded-full"
        :style="{ width: `${92 - n * 14}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const STATIONS = ['server', 'payload', 'socket']
</script>

<style scoped>
.line {
  background: var(--ui-border-accented);
}
.led {
  background: var(--ui-text-dimmed);
}
.pulse {
  left: 0.75rem;
  opacity: 0;
  background: var(--band, var(--color-signal-500));
  box-shadow: var(--band-glow, var(--glow-primary-soft));
}
.bar {
  background: var(--ui-text-dimmed);
  opacity: 0.55;
}
.state-live {
  opacity: 0;
  color: var(--band, var(--color-signal-500));
}
@media (prefers-reduced-motion: no-preference) {
  .pulse { animation: ssr-pulse 5.4s ease-in-out infinite; }
  .station .led { animation: ssr-led 5.4s ease-in-out infinite; animation-delay: calc(var(--i) * 1.2s); }
  .bar { animation: ssr-bar 5.4s ease-in-out infinite; }
  .state-html { animation: ssr-html 5.4s ease-in-out infinite; }
  .state-live { animation: ssr-live 5.4s ease-in-out infinite; }
}
@keyframes ssr-pulse {
  0%, 6% { left: 0.75rem; opacity: 0; }
  10% { opacity: 1; }
  32% { left: 50%; }
  54% { left: calc(100% - 0.75rem - 0.375rem); opacity: 1; }
  60%, 100% { left: calc(100% - 0.75rem - 0.375rem); opacity: 0; }
}
@keyframes ssr-led {
  0%, 8% { background: var(--ui-text-dimmed); box-shadow: none; }
  14%, 80% { background: var(--band, var(--color-signal-500)); box-shadow: var(--band-glow, var(--glow-primary-soft)); }
  92%, 100% { background: var(--ui-text-dimmed); box-shadow: none; }
}
/* The rows are drawn by the server (station one) and never blink in;
   they only tint when the socket owns them. */
@keyframes ssr-bar {
  0%, 10% { opacity: 0; }
  16%, 54% { opacity: 0.55; background: var(--ui-text-dimmed); }
  60%, 84% { opacity: 0.9; background: var(--band, var(--color-signal-500)); }
  94%, 100% { opacity: 0; }
}
@keyframes ssr-html {
  0%, 30% { opacity: 0; }
  36%, 54% { opacity: 1; }
  60%, 100% { opacity: 0; }
}
@keyframes ssr-live {
  0%, 56% { opacity: 0; }
  62%, 86% { opacity: 1; }
  94%, 100% { opacity: 0; }
}
</style>
