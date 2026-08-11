<template>
  <!-- One hub, three subscribers: packets leave the socket and every endpoint
       LED lights as its packet lands. Reduced motion shows the calm wired
       topology — hub lit, lanes connected. -->
  <div class="flex w-full max-w-52 items-center gap-2.5">
    <i class="hub size-2.5 flex-none rounded-full" />
    <div class="flex min-w-0 flex-1 flex-col gap-2.5">
      <div
        v-for="n in 3"
        :key="n"
        class="lane relative h-px"
        :style="{ '--lane': n - 1 }"
      >
        <i class="packet absolute top-1/2 left-0 size-1.5 -translate-y-1/2 rounded-full" />
        <i class="sub absolute top-1/2 right-0 size-1.5 -translate-y-1/2 rounded-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hub {
  background: var(--color-signal-500);
  box-shadow: var(--glow-primary-soft);
}
.lane {
  background: var(--ui-border-accented);
}
.packet {
  opacity: 0;
  background: var(--color-signal-500);
}
.sub {
  background: var(--ui-text-dimmed);
}
@media (prefers-reduced-motion: no-preference) {
  .packet {
    animation: live-packet 2.8s ease-in-out infinite;
    animation-delay: calc(var(--lane) * 0.45s);
  }
  .sub {
    animation: live-sub 2.8s ease-in-out infinite;
    animation-delay: calc(var(--lane) * 0.45s);
  }
}
@keyframes live-packet {
  0% { left: 0; opacity: 0; }
  12% { opacity: 1; }
  52% { left: calc(100% - 0.375rem); opacity: 1; }
  62%, 100% { left: calc(100% - 0.375rem); opacity: 0; }
}
@keyframes live-sub {
  0%, 50% { background: var(--ui-text-dimmed); box-shadow: none; }
  58%, 80% { background: var(--color-signal-500); box-shadow: var(--glow-primary-soft); }
  96%, 100% { background: var(--ui-text-dimmed); box-shadow: none; }
}
</style>
