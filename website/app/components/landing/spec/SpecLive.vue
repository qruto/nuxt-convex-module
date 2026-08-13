<template>
  <!-- One hub, three subscribers. The hub pulses once — the commit — then all
       three packets depart TOGETHER and every endpoint LED lights on the same
       tick: lanes were staggered before, which quietly contradicted the
       card's whole claim. Reduced motion shows the calm wired topology. -->
  <div class="flex w-full max-w-52 items-center gap-2.5">
    <i class="hub size-2.5 flex-none rounded-full" />
    <div class="flex min-w-0 flex-1 flex-col gap-2.5">
      <div
        v-for="n in 3"
        :key="n"
        class="lane relative h-px"
      >
        <i class="packet absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full" />
        <i class="sub absolute top-1/2 right-0 size-1.5 -translate-y-1/2 rounded-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hub {
  background: var(--band, var(--color-signal-500));
  box-shadow: var(--band-glow, var(--glow-primary-soft));
}
.lane {
  background: var(--ui-border-accented);
}
.packet {
  opacity: 0;
  background: var(--band, var(--color-signal-500));
}
.sub {
  background: var(--ui-text-dimmed);
}
@media (prefers-reduced-motion: no-preference) {
  .hub {
    animation: live-hub 3.2s ease-in-out infinite;
  }
  .packet {
    animation: live-packet 3.2s ease-in-out infinite;
  }
  .sub {
    animation: live-sub 3.2s ease-in-out infinite;
  }
}
/* The commit: one bright squeeze at the hub right before the fan-out. */
@keyframes live-hub {
  0%, 4% { scale: 1; }
  8% { scale: 1.5; box-shadow: 0 0 14px color-mix(in srgb, var(--band, var(--color-signal-500)) 70%, transparent); }
  16%, 100% { scale: 1; }
}
@keyframes live-packet {
  0%, 8% { left: 0; opacity: 0; }
  16% { opacity: 1; }
  50% { left: calc(100% - 0.375rem); opacity: 1; }
  58%, 100% { left: calc(100% - 0.375rem); opacity: 0; }
}
@keyframes live-sub {
  0%, 48% { background: var(--ui-text-dimmed); box-shadow: none; }
  54%, 82% { background: var(--band, var(--color-signal-500)); box-shadow: var(--band-glow, var(--glow-primary-soft)); }
  96%, 100% { background: var(--ui-text-dimmed); box-shadow: none; }
}
</style>
