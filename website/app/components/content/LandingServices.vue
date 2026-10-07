<script setup lang="ts">
// The compatibility plate — a slim rail under the hero listing the services
// the module works with, grouped by what each one does for the app (three
// interchangeable auth providers, then billing, then email). Informational
// only: the tour's auth entry (LandingTour.vue) carries the navigation to
// /components, so the plate stays a plate. Marks wear the vendors'
// published brand colors, and only on hover; ink-only brands (Better
// Auth, Resend) take full page ink instead. The hover is per-entry: each
// service is its own listing. Better Auth's mark is inlined from its brand
// SVG (no iconify set carries the official one).
interface ServiceEntry {
  id: string
  label: string
  pkg: string
  icon?: string
  color?: string
}

// One group per role, captioned once; a hairline divider separates groups.
const GROUPS: Array<{ role: string, services: ServiceEntry[] }> = [
  {
    role: 'auth',
    services: [
      { id: 'better-auth', label: 'better auth', pkg: '@convex-dev/better-auth' },
      { id: 'clerk', label: 'clerk', pkg: '@clerk/vue', icon: 'i-simple-icons-clerk', color: '#6c47ff' },
      { id: 'auth0', label: 'auth0', pkg: '@auth0/auth0-vue', icon: 'i-simple-icons-auth0', color: '#eb5424' },
    ],
  },
  {
    role: 'billing',
    services: [{ id: 'polar', label: 'polar', pkg: '@convex-dev/polar', icon: 'i-iconoir-polar-sh', color: '#0062ff' }],
  },
  {
    role: 'email',
    services: [{ id: 'resend', label: 'resend', pkg: '@convex-dev/resend', icon: 'i-simple-icons-resend' }],
  },
]
</script>

<template>
  <!-- The rail is the ONE flat surface on the landing: no mill finish of its
       own, and an opaque fill so the hero's grain stops at its top edge. The
       marks it carries are other people's brands — a texture running under them
       is noise across five logos. With the finish gone the strip needs its
       own edges, so it takes a scribed hairline top and bottom. -->
  <div class="landing-services border-t border-b border-default">
    <UContainer class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-8 py-6 sm:px-12 lg:justify-between lg:px-16">
      <p class="stamp m-0 text-muted">
        works with · official add-ons
      </p>
      <!-- role="list" is not redundant: Safari drops list semantics from a
           list-style: none list, and the lists' names went with them. -->
      <ul
        role="list"
        aria-label="Supported services"
        class="m-0 flex list-none flex-wrap items-center justify-center gap-x-7 gap-y-4 p-0"
      >
        <template
          v-for="(group, index) in GROUPS"
          :key="group.role"
        >
          <li
            v-if="index > 0"
            aria-hidden="true"
            class="hidden h-9 w-px bg-(--ui-border) sm:block"
          />
          <li class="flex flex-col gap-1.5">
            <span class="stamp text-[0.55rem] text-muted">{{ group.role }}</span>
            <ul
              role="list"
              :aria-label="group.role"
              class="m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0"
            >
              <li
                v-for="entry in group.services"
                :key="entry.id"
                class="service flex items-center gap-2"
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
                <span class="stamp text-toned">{{ entry.label }}</span>
              </li>
            </ul>
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
