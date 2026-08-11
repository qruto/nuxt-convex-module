<template>
  <!-- The parity claim as one line of code wearing two badges: the same call,
       React's ecosystem on one face, Vue's on the other. Static fallback and
       reduced motion show the Vue face — this is the Vue client, after all. -->
  <div class="flex min-w-0 items-center gap-2.5 font-mono">
    <span class="relative grid size-6 flex-none place-items-center">
      <UIcon
        name="i-simple-icons-react"
        class="badge-react size-4.5 text-toned [grid-area:1/1]"
      />
      <UIcon
        name="i-simple-icons-vuedotjs"
        class="badge-vue size-4.5 text-toned [grid-area:1/1]"
      />
    </span>
    <code class="etched min-w-0 truncate rounded-md px-2 py-1 text-[0.66rem] text-highlighted">useQuery(api.messages.list)</code>
  </div>
</template>

<style scoped>
.badge-react {
  opacity: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .badge-react {
    animation: parity-react 5.2s ease-in-out infinite;
  }
  .badge-vue {
    animation: parity-vue 5.2s ease-in-out infinite;
  }
}
@keyframes parity-react {
  0%, 42% { opacity: 0; }
  50%, 88% { opacity: 1; }
  96%, 100% { opacity: 0; }
}
@keyframes parity-vue {
  0%, 42% { opacity: 1; }
  50%, 88% { opacity: 0; }
  96%, 100% { opacity: 1; }
}
</style>
