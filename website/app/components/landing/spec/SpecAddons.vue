<template>
  <!-- The shelf of official marks the client (or your Convex backend) speaks
       to. Dimmed until the card is hovered, then each lifts in sequence —
       the stagger rides transition-delay, so reduced-motion visitors just
       see them brighten. Better Auth's mark is inlined from its brand SVG
       (no iconify set carries the official one); the rest resolve through
       the site's icon pipeline. -->
  <ul class="m-0 flex list-none items-center gap-4 p-0 text-toned">
    <li
      v-for="(logo, index) in LOGOS"
      :key="logo.id"
      class="grid place-items-center opacity-60 transition-[opacity,translate] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:opacity-100"
      :style="{ transitionDelay: `${index * 40}ms` }"
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
const LOGOS: Array<{ id: string, label: string, icon?: string }> = [
  { id: 'better-auth', label: 'Better Auth' },
  { id: 'polar', label: 'Polar', icon: 'i-iconoir-polar-sh' },
  { id: 'clerk', label: 'Clerk', icon: 'i-simple-icons-clerk' },
  { id: 'auth0', label: 'Auth0', icon: 'i-simple-icons-auth0' },
  { id: 'resend', label: 'Resend', icon: 'i-simple-icons-resend' },
]
</script>
