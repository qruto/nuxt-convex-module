<template>
  <!-- What "hardened by default" is, as the checklist the module ticks
       for you — not one header, the four surfaces the security guide
       tables: the CSP learning the deployment's origins, the auth proxy
       pinned to its methods and never cached, authenticated SSR going out
       no-store, and the login redirect closed. Each line ticks in turn and
       the shield closes once all four have. Reduced motion shows the
       finished list. -->
  <div class="flex w-full flex-col gap-2.5 font-mono">
    <div class="flex items-center gap-2 px-1 text-[0.58rem] text-dimmed">
      <span class="relative grid size-4 flex-none place-items-center">
        <UIcon
          name="i-lucide-shield"
          class="ico-open size-4 [grid-area:1/1]"
        />
        <UIcon
          name="i-lucide-shield-check"
          class="ico-shut size-4 [grid-area:1/1]"
        />
      </span>
      <span class="truncate">nuxt-security · convex defaults</span>
    </div>
    <ul class="part-well m-0 flex list-none flex-col gap-1 px-4 py-2.5 text-[0.62rem] leading-4">
      <li
        v-for="(guard, i) in GUARDS"
        :key="guard.label"
        class="guard flex min-w-0 items-center gap-2.5"
        :style="{ '--i': i }"
      >
        <span class="relative grid size-3 flex-none place-items-center">
          <i class="dot size-1.5 rounded-full [grid-area:1/1]" />
          <UIcon
            name="i-lucide-check"
            class="tick size-3 [grid-area:1/1]"
          />
        </span>
        <span class="w-18 flex-none truncate text-toned">{{ guard.label }}</span>
        <span class="value min-w-0 truncate">{{ guard.value }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// The four rows of the guide's "what ships hardened" table, one value each.
const GUARDS = [
  { label: 'csp', value: 'connect-src · img-src · media-src' },
  { label: 'auth proxy', value: 'GET POST only · never cached' },
  { label: 'ssr html', value: 'Cache-Control: no-store' },
  { label: 'redirects', value: 'resolveAuthRedirect()' },
]
</script>

<style scoped>
.ico-shut {
  opacity: 0;
  color: var(--band, var(--color-signal-500));
}
.dot {
  background: var(--ui-text-dimmed);
  opacity: 0.6;
}
.tick, .value {
  color: var(--band, var(--color-signal-500));
}
@media (prefers-reduced-motion: no-preference) {
  /* Each row's tick and value own one slot; the slot is the delay. The
     dot fades as the tick lands. */
  .guard .dot { animation: sec-dot 5.6s ease-in-out infinite; animation-delay: calc(var(--i) * 0.55s); }
  .guard .tick { animation: sec-tick 5.6s cubic-bezier(0.2, 1.4, 0.4, 1) infinite; animation-delay: calc(var(--i) * 0.55s); }
  .guard .value { animation: sec-value 5.6s ease-in-out infinite; animation-delay: calc(var(--i) * 0.55s); }
  .ico-open { animation: sec-open 5.6s ease-in-out infinite; }
  .ico-shut { animation: sec-shut 5.6s ease-in-out infinite; }
}
/* Slots: row i ticks at 10% + i * ~10%; everything holds to 86% and
   resets together, so the list is never half-cleared. */
@keyframes sec-dot {
  0%, 10% { opacity: 0.6; }
  14%, 86% { opacity: 0; }
  94%, 100% { opacity: 0.6; }
}
@keyframes sec-tick {
  0%, 10% { opacity: 0; scale: 0.5; }
  15%, 86% { opacity: 1; scale: 1; }
  94%, 100% { opacity: 0; scale: 0.5; }
}
@keyframes sec-value {
  0%, 10% { opacity: 0.35; color: var(--ui-text-dimmed); }
  15%, 86% { opacity: 1; color: var(--band, var(--color-signal-500)); }
  94%, 100% { opacity: 0.35; color: var(--ui-text-dimmed); }
}
/* The shield closes after the last row (row 3 lands at ~44%). */
@keyframes sec-open {
  0%, 46% { opacity: 1; }
  50%, 86% { opacity: 0; }
  94%, 100% { opacity: 1; }
}
@keyframes sec-shut {
  0%, 46% { opacity: 0; scale: 0.8; }
  52%, 86% { opacity: 1; scale: 1; }
  94%, 100% { opacity: 0; scale: 0.8; }
}
</style>
