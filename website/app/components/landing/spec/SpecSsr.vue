<template>
  <!-- What useAsyncQuery does, as three stations on a line: the SERVER
       runs the query and writes the rows into the HTML, the PAYLOAD
       carries them to the browser (the rows are already there — nothing
       blinks in), and the SOCKET takes over the same rows live. The pulse
       walks the line; each station lights as it arrives. Reduced motion
       shows the finished, live document. -->
  <div class="flex w-full flex-col gap-3 font-mono">
    <!-- Three equal columns, a station centred in each, so the LEDs sit
         at 1/6, 1/2 and 5/6 of the width and the line and the pulse can
         be placed against those thirds. -->
    <div class="relative grid grid-cols-3">
      <i class="line absolute top-1 h-px" />
      <i class="pulse absolute size-1.5 rounded-full" />
      <span
        v-for="(station, i) in STATIONS"
        :key="station"
        class="station relative flex flex-col items-center gap-1.5"
        :style="{ '--i': i }"
      >
        <i class="led size-2 rounded-full" />
        <span class="text-[0.58rem] text-dimmed">{{ station }}</span>
      </span>
    </div>
    <div class="part-well flex flex-col gap-2 px-4 py-2.5">
      <div class="flex items-center justify-between text-[0.58rem] text-dimmed">
        <span>&lt;ul&gt;</span>
        <span class="grid justify-items-end">
          <span class="state state-html [grid-area:1/1]">in the html</span>
          <span class="state state-live [grid-area:1/1]">live</span>
        </span>
      </div>
      <i
        v-for="n in 3"
        :key="n"
        class="bar h-1.5 rounded-full"
        :style="{ width: `${88 - n * 14}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const STATIONS = ['server', 'payload', 'socket']
</script>

<style scoped>
.line {
  left: calc(100% / 6);
  right: calc(100% / 6);
  background: var(--ui-border-accented);
}
.led {
  background: var(--ui-text-dimmed);
}
/* The pulse is centred on a station by `left: <third>` plus a -50%
   translate of its OWN size — never a rem offset: the stage zooms the
   art and Chrome does not zoom a rem inside an animated position, which
   left the pulse off the LED at every stop (2026-09-14). */
.pulse {
  top: 0.25rem;
  left: calc(100% / 6);
  translate: -50% -50%;
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
  .station .led { animation: ssr-led 5.4s ease-in-out infinite; animation-delay: calc(var(--i) * 1.19s); }
  .bar { animation: ssr-bar 5.4s ease-in-out infinite; }
  .state-html { animation: ssr-html 5.4s ease-in-out infinite; }
  .state-live { animation: ssr-live 5.4s ease-in-out infinite; }
}
/* One timeline, three stops. The pulse DWELLS on each station — it
   sits on the LED it just lit before it moves on — and the station LEDs
   light on the same marks: server at 10%, payload at 32%, socket at 54%
   (the delay is one stop, 22% of the cycle). */
@keyframes ssr-pulse {
  0%, 6% { left: calc(100% / 6); opacity: 0; }
  10%, 18% { left: calc(100% / 6); opacity: 1; }
  30%, 40% { left: 50%; }
  52%, 62% { left: calc(100% * 5 / 6); opacity: 1; }
  68%, 100% { left: calc(100% * 5 / 6); opacity: 0; }
}
@keyframes ssr-led {
  0%, 7% { background: var(--ui-text-dimmed); box-shadow: none; }
  11%, 80% { background: var(--band, var(--color-signal-500)); box-shadow: var(--band-glow, var(--glow-primary-soft)); }
  92%, 100% { background: var(--ui-text-dimmed); box-shadow: none; }
}
/* The rows are drawn by the server (station one) and never blink in;
   they only tint when the socket owns them. */
@keyframes ssr-bar {
  0%, 10% { opacity: 0; }
  16%, 52% { opacity: 0.55; background: var(--ui-text-dimmed); }
  58%, 86% { opacity: 0.9; background: var(--band, var(--color-signal-500)); }
  94%, 100% { opacity: 0; }
}
@keyframes ssr-html {
  0%, 30% { opacity: 0; }
  34%, 52% { opacity: 1; }
  58%, 100% { opacity: 0; }
}
@keyframes ssr-live {
  0%, 54% { opacity: 0; }
  60%, 86% { opacity: 1; }
  94%, 100% { opacity: 0; }
}
</style>
