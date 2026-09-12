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
  { id: 'better-auth', label: 'better auth', role: 'auth', pkg: '@convex-dev/better-auth' },
  { id: 'clerk', label: 'clerk', role: 'auth', pkg: '@clerk/vue', icon: 'i-simple-icons-clerk', color: '#6c47ff' },
  { id: 'auth0', label: 'auth0', role: 'auth', pkg: '@auth0/auth0-vue', icon: 'i-simple-icons-auth0', color: '#eb5424' },
  null,
  { id: 'polar', label: 'polar', role: 'billing', pkg: '@convex-dev/polar', icon: 'i-iconoir-polar-sh', color: '#0062ff' },
  null,
  { id: 'resend', label: 'resend', role: 'email', pkg: '@convex-dev/resend', icon: 'i-simple-icons-resend' },
]
</script>

<template>
  <!-- The rail is the ONE flat surface on the landing: no mill finish of its
       own, and an opaque fill so the hero's grain stops at its top edge. The
       marks it carries are other people's brands — a texture running under them
       is noise across nine logos. With the finish gone the strip needs its
       own edges, so it takes a scribed hairline top and bottom. -->
  <div class="landing-services border-t border-b border-default">
    <UContainer class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-8 py-9 sm:px-12 lg:justify-between lg:px-16">
      <p class="stamp m-0 text-dimmed">
        works with · official add-ons
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
              <span class="stamp text-toned">{{ entry.label }}</span>
              <span class="stamp text-[0.55rem] text-dimmed">{{ entry.role }}</span>
            </span>
          </li>
        </template>
      </ul>
    </UContainer>
  </div>
</template>

<style scoped>
/* Flat ground, painted opaquely: the hero's bloom and grain wash over
   everything above this strip and must not carry into it. */
.landing-services {
  background-color: var(--ui-bg);
}

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
