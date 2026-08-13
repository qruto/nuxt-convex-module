<template>
  <!-- The shelf of official marks the client (or your Convex backend) speaks
       to. An ambient detection scan pings each mark in sequence — the module
       finding what's installed — and hovering the card lights the whole shelf
       in the vendors' own brand colors (ink for the ink-only brands). The
       stagger rides transition-delay, so reduced-motion visitors still see
       them brighten. Better Auth's mark is inlined from its brand SVG (no
       iconify set carries the official one); the rest resolve through the
       site's icon pipeline. -->
  <ul class="m-0 flex list-none items-center gap-4 p-0 text-toned">
    <li
      v-for="(logo, index) in LOGOS"
      :key="logo.id"
      class="mark grid place-items-center opacity-60 transition-[opacity,translate,color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:opacity-100"
      :style="{ 'transitionDelay': `${index * 40}ms`, '--i': index, '--mark': logo.color ?? 'currentColor' }"
      :title="logo.label"
    >
      <svg
        v-if="logo.id === 'better-auth'"
        viewBox="0 0 400 300"
        class="size-4 fill-current"
        role="img"
        :aria-label="logo.label"
      ><path d="M200 0h200v300H200V200h100V100H200zM0 0h100v100h100v100H100v100H0z" /></svg>
      <UIcon
        v-else
        :name="logo.icon!"
        class="size-4.5"
        :aria-label="logo.label"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
// Brand colors are the vendors' published values, verbatim — the same rule
// the hero lockups follow. Ink-only brands (Better Auth, Resend) stay ink.
const LOGOS: Array<{ id: string, label: string, icon?: string, color?: string }> = [
  { id: 'better-auth', label: 'Better Auth' },
  { id: 'polar', label: 'Polar', icon: 'i-iconoir-polar-sh', color: '#0062ff' },
  { id: 'clerk', label: 'Clerk', icon: 'i-simple-icons-clerk', color: '#6c47ff' },
  { id: 'auth0', label: 'Auth0', icon: 'i-simple-icons-auth0', color: '#eb5424' },
  { id: 'resend', label: 'Resend', icon: 'i-simple-icons-resend' },
]
</script>

<style scoped>
/* Card hover: every mark takes its own brand color (ink brands take full
   ink via the opacity step alone). */
.group:hover .mark {
  color: var(--mark);
}
/* The detection scan — one ping walks the shelf, then the shelf rests.
   Hover drops the animation entirely (a paused one would still override
   the hover styles) and the transitions above take it from there. */
@media (prefers-reduced-motion: no-preference) {
  .mark {
    animation: addon-scan 5.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.42s);
  }
  .group:hover .mark {
    animation: none;
  }
}
@keyframes addon-scan {
  0%, 3% { opacity: 0.6; translate: 0 0; }
  8%, 12% { opacity: 1; translate: 0 -2px; color: var(--mark); }
  20%, 100% { opacity: 0.6; translate: 0 0; }
}
</style>
