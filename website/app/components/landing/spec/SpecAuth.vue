<template>
  <!-- One auth state, whoever provides it: the session lamp flips and the
       two components swap in the same slot, while the providers that can
       feed that state sit on the shelf below. Reduced motion shows the
       signed-in state. -->
  <div class="flex w-full max-w-52 flex-col items-center gap-3 font-mono">
    <div class="grid text-[0.64rem] text-highlighted">
      <span class="state state-in inline-flex items-center gap-1.5 [grid-area:1/1]"><i class="led size-1.5 rounded-full" />&lt;Authenticated&gt;</span>
      <span class="state state-out inline-flex items-center gap-1.5 text-dimmed [grid-area:1/1]"><i class="size-1.5 rounded-full bg-(--ui-text-dimmed)" />&lt;Unauthenticated&gt;</span>
    </div>
    <ul class="m-0 flex list-none items-center gap-3.5 p-0 text-toned">
      <li
        v-for="logo in LOGOS"
        :key="logo.id"
        class="mark grid place-items-center opacity-60 transition-[opacity,color] duration-200 ease-out"
        :style="{ '--mark': logo.color ?? 'currentColor' }"
        :title="logo.label"
      >
        <svg
          v-if="logo.id === 'better-auth'"
          viewBox="0 0 400 300"
          class="size-3.5 fill-current"
          role="img"
          :aria-label="logo.label"
        ><path d="M200 0h200v300H200V200h100V100H200zM0 0h100v100h100v100H100v100H0z" /></svg>
        <UIcon
          v-else
          :name="logo.icon!"
          class="size-4"
          :aria-label="logo.label"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// Brand colors are the vendors' published values, verbatim. Ink-only brands
// (Better Auth, Resend) stay ink.
const LOGOS: Array<{ id: string, label: string, icon?: string, color?: string }> = [
  { id: 'better-auth', label: 'Better Auth' },
  { id: 'clerk', label: 'Clerk', icon: 'i-simple-icons-clerk', color: '#6c47ff' },
  { id: 'auth0', label: 'Auth0', icon: 'i-simple-icons-auth0', color: '#eb5424' },
  { id: 'polar', label: 'Polar', icon: 'i-iconoir-polar-sh', color: '#0062ff' },
  { id: 'resend', label: 'Resend', icon: 'i-simple-icons-resend' },
]
</script>

<style scoped>
.led {
  background: var(--band, var(--color-signal-500));
  box-shadow: var(--band-glow, var(--glow-primary-soft));
}
.state-out { opacity: 0; }
.group:hover .mark {
  color: var(--mark);
  opacity: 1;
}
@media (prefers-reduced-motion: no-preference) {
  .state-in { animation: auth-in 5s ease-in-out infinite; }
  .state-out { animation: auth-out 5s ease-in-out infinite; }
}
@keyframes auth-in {
  0%, 56% { opacity: 1; }
  62%, 90% { opacity: 0; }
  96%, 100% { opacity: 1; }
}
@keyframes auth-out {
  0%, 56% { opacity: 0; }
  62%, 90% { opacity: 1; }
  96%, 100% { opacity: 0; }
}
</style>
