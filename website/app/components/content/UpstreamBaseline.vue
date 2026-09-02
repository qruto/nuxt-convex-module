<script setup lang="ts">
import type { UpstreamSource } from '~/utils/upstream-baselines'

// Every ported page states the upstream release it is currently in sync with,
// on the page rather than only in PARITY.md. The number is never spelled in
// markdown — it comes off the shared baseline table (app/utils/upstream-
// baselines.ts), so a sync bump moves one value and every plate follows.
const props = withDefaults(
  defineProps<{
    /** Which pinned baseline this page tracks. */
    source?: UpstreamSource
    /**
     * Overrides the baseline's entry points. Clerk and Auth0 have no package
     * of their own — they port one entry each out of `convex`.
     */
    entry?: string
  }>(),
  { source: 'convex', entry: undefined },
)

// An unknown `source` renders nothing rather than falling back to a neighbour:
// a missing plate shows up in review, a confidently wrong version does not.
const baseline = computed(() => upstreamBaselines[props.source])
</script>

<template>
  <div
    v-if="baseline"
    class="concave my-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg px-3.5 py-2.5 font-mono text-xs"
  >
    <!-- The same accent tick the section eyebrows wear — this is a spec
         label, so it opens the way every other one on the site does. -->
    <span
      class="h-[3px] w-[22px] shrink-0 rounded-full bg-primary shadow-(--glow-primary-soft)"
      aria-hidden="true"
    />
    <span class="concave-text font-semibold tracking-[0.14em] text-toned uppercase">
      matches upstream
    </span>
    <span class="font-semibold text-highlighted">{{ baseline.package }}@{{ baseline.version }}</span>
    <span class="text-muted">{{ entry ?? baseline.entries }}</span>
    <NuxtLink
      :to="PARITY_MANIFEST_URL"
      target="_blank"
      class="ms-auto text-toned underline-offset-4 transition-colors hover:text-primary hover:underline"
    >
      parity map
    </NuxtLink>
  </div>
</template>
