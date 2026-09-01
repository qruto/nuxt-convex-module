<template>
  <!-- The parity claim as one line of code wearing two badges: the same call,
       React's ecosystem on one face, Vue's on the other — each in its own
       brand color, because the point is two real ecosystems sharing one line.
       Static fallback and reduced motion show the Vue face — this is the Vue
       client, after all. -->
  <div class="flex min-w-0 items-center gap-2.5 font-mono">
    <span class="relative grid size-6 flex-none place-items-center">
      <UIcon
        name="i-simple-icons-react"
        class="badge-react size-4.5 [grid-area:1/1]"
      />
      <UIcon
        name="i-simple-icons-vuedotjs"
        class="badge-vue size-4.5 [grid-area:1/1]"
      />
    </span>
    <code class="concave-text min-w-0 truncate rounded-md px-2 py-1 text-[0.66rem] text-highlighted">useQuery(api.messages.list)</code>
  </div>
</template>

<style scoped>
/* Brand hues re-set in OKLCH on each scheme's contrast floor: the dark faces
   are the vendors' own values (#61dafb / #42b883 round-tripped), the light
   faces keep each hue and drop lightness so they hold on the light stage. */
.badge-react {
  opacity: 0;
  color: light-dark(oklch(58% 0.095 219), oklch(83.2% 0.1167 218.7));
}
.badge-vue {
  color: light-dark(oklch(58% 0.115 160), oklch(70.3% 0.132 160.4));
}
@media (prefers-reduced-motion: no-preference) {
  .badge-react {
    animation: parity-react 5.2s ease-in-out infinite;
  }
  .badge-vue {
    animation: parity-vue 5.2s ease-in-out infinite;
  }
}
/* The incoming face lands with a small settle; the outgoing one just dims —
   a swap, not a spin. */
@keyframes parity-react {
  0%, 42% { opacity: 0; scale: 0.82; }
  50%, 88% { opacity: 1; scale: 1; }
  96%, 100% { opacity: 0; scale: 0.82; }
}
@keyframes parity-vue {
  0%, 42% { opacity: 1; scale: 1; }
  50%, 88% { opacity: 0; scale: 0.82; }
  96%, 100% { opacity: 1; scale: 1; }
}
</style>
