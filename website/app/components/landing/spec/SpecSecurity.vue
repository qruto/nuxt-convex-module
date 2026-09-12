<template>
  <!-- The response header the module writes for you: a CSP that learns the
       deployment's origins at runtime. The two Convex origins append to the
       directive one after the other, and the shield closes once they have.
       Reduced motion shows the finished header. -->
  <div class="flex w-full max-w-52 flex-col gap-2 font-mono text-[0.58rem]">
    <div class="flex items-center gap-1.5 text-dimmed">
      <span class="relative grid size-3.5 flex-none place-items-center">
        <UIcon
          name="i-lucide-shield"
          class="ico-open size-3.5 [grid-area:1/1]"
        />
        <UIcon
          name="i-lucide-shield-check"
          class="ico-shut size-3.5 [grid-area:1/1]"
        />
      </span>
      <span class="truncate">content-security-policy</span>
    </div>
    <div class="rounded-md border border-accented px-2 py-1.5 leading-relaxed">
      <span class="text-toned">connect-src</span>
      <span class="text-highlighted"> 'self'</span>
      <span class="origin origin-a block truncate pl-3">https://…convex.cloud</span>
      <span class="origin origin-b block truncate pl-3">wss://…convex.cloud</span>
    </div>
  </div>
</template>

<style scoped>
.ico-shut {
  opacity: 0;
  color: var(--band, var(--color-signal-500));
}
.origin {
  color: var(--band, var(--color-signal-500));
}
@media (prefers-reduced-motion: no-preference) {
  .origin-a { animation: sec-origin 5.2s ease-in-out infinite; }
  .origin-b { animation: sec-origin 5.2s ease-in-out infinite; animation-delay: 0.5s; }
  .ico-open { animation: sec-open 5.2s ease-in-out infinite; }
  .ico-shut { animation: sec-shut 5.2s ease-in-out infinite; }
}
@keyframes sec-origin {
  0%, 12% { opacity: 0; translate: -4px 0; }
  20%, 88% { opacity: 1; translate: 0 0; }
  96%, 100% { opacity: 0; translate: -4px 0; }
}
@keyframes sec-open {
  0%, 32% { opacity: 1; }
  36%, 88% { opacity: 0; }
  96%, 100% { opacity: 1; }
}
@keyframes sec-shut {
  0%, 32% { opacity: 0; scale: 0.8; }
  38%, 88% { opacity: 1; scale: 1; }
  96%, 100% { opacity: 0; scale: 0.8; }
}
</style>
