<script setup lang="ts">
// The compatibility plate — a slim rail under the hero listing the services
// the module works with, grouped by what each one does for the app (three
// interchangeable auth providers, then billing, then email). Informational
// only: the ADD-ONS spec card below carries the navigation, so the plate
// stays a plate. Marks follow the SpecAddons rule — the vendors' published
// brand colors, and only on hover; ink-only brands (Better Auth, Resend)
// take full page ink instead. The hover is per-entry where the spec card
// lights its whole shelf: here each service is its own listing, not one
// card's cargo. Better Auth's mark is inlined from its brand SVG (no
// iconify set carries the official one).
interface ServiceEntry {
  id: string
  label: string
  role: string
  pkg: string
  icon?: string
  color?: string
}

// A `null` is a group seam — rendered as a hairline divider between the
// auth block, billing, and email.
const RAIL: Array<ServiceEntry | null> = [
  { id: 'better-auth', label: 'BETTER AUTH', role: 'AUTH', pkg: '@convex-dev/better-auth' },
  { id: 'clerk', label: 'CLERK', role: 'AUTH', pkg: '@clerk/vue', icon: 'i-simple-icons-clerk', color: '#6c47ff' },
  { id: 'auth0', label: 'AUTH0', role: 'AUTH', pkg: '@auth0/auth0-vue', icon: 'i-simple-icons-auth0', color: '#eb5424' },
  null,
  { id: 'polar', label: 'POLAR', role: 'BILLING', pkg: '@convex-dev/polar', icon: 'i-iconoir-polar-sh', color: '#0062ff' },
  null,
  { id: 'resend', label: 'RESEND', role: 'EMAIL', pkg: '@convex-dev/resend', icon: 'i-simple-icons-resend' },
]
</script>

<template>
  <div class="border-b border-default">
    <UContainer class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-5 lg:justify-between">
      <p class="etched m-0 font-mono text-[0.6rem] font-semibold tracking-[0.14em] text-dimmed">
        WORKS WITH · OFFICIAL ADD-ONS
      </p>
      <ul
        aria-label="Supported services"
        class="m-0 flex list-none flex-wrap items-center justify-center gap-x-7 gap-y-4 p-0"
      >
        <template
          v-for="(entry, index) in RAIL"
          :key="entry?.id ?? `seam-${index}`"
        >
          <li
            v-if="entry === null"
            aria-hidden="true"
            class="hidden h-6 w-px bg-(--ui-border) sm:block"
          />
          <li
            v-else
            class="service flex items-center gap-2.5"
            :style="{ '--mark': entry.color ?? 'currentColor' }"
            :title="entry.pkg"
          >
            <svg
              v-if="entry.id === 'better-auth'"
              viewBox="0 0 400 300"
              class="mark size-4.5 fill-current"
              aria-hidden="true"
            ><path d="M200 0h200v300H200V200h100V100H200zM0 0h100v100h100v100H100v100H0z" /></svg>
            <UIcon
              v-else
              :name="entry.icon!"
              class="mark size-5"
              aria-hidden="true"
            />
            <span class="flex flex-col">
              <span class="etched font-mono text-[0.62rem] font-semibold tracking-[0.14em] text-toned">{{ entry.label }}</span>
              <span class="font-mono text-[0.5rem] tracking-[0.18em] text-dimmed">{{ entry.role }}</span>
            </span>
          </li>
        </template>
      </ul>
    </UContainer>
  </div>
</template>

<style scoped>
/* Rest state is uniform brushed ink; hover hands a mark its vendor's own
   color (ink-only brands resolve currentColor to full page ink via the
   opacity step). Color and opacity only — the plate doesn't move. */
.mark {
  opacity: 0.72;
  transition: opacity 0.2s var(--ease-out), color 0.2s var(--ease-out);
}
.service:hover .mark {
  color: var(--mark);
  opacity: 1;
}
</style>
