<script setup lang="ts">
// The spec strip — a readout cut into the hero ground carrying the five
// figures the module is stated against: its own published version, the
// three peer ranges, and the upstream Convex release the port matches. It
// sits under the calls to action and runs the copy column's full width
// (2026-09-14: "less dark, aligned with the container, concave").
//
// The peer ranges arrive as props from the markdown (`:landing-version-chip
// {nuxt="≥ 4.1" vue="≥ 3.5" convex="≥ 1.40"}`) — they are the page's copy,
// and the strip needs them as label/figure pairs rather than as one
// sentence to split.
const props = defineProps<{
  /** The Nuxt range the module supports, as the page states it. */
  nuxt: string
  /** The Vue range the module supports, as the page states it. */
  vue: string
  /** The Convex range the module supports (its peer range), as the page states it. */
  convex: string
}>()

// The published version comes off the npm registry (cached server-side for an
// hour) rather than pinned in the markup — a hardcoded number is wrong from
// the next release onward. Unresolvable → the cell is dropped and the strip
// closes up to three: a missing figure is honest, an invented one is not.
//
// Client-only on purpose: the landing is prerendered, so a server fetch would
// bake whatever the registry said at build time — and the build runs before
// the release workflow has published (the merge deploys first), then later
// builds reuse the cached handler answer Vercel restores with `.nuxt/`
// (production showed 0.0.1 for hours after 0.9.0 shipped, 2026-09-15).
const { data: npm } = await useFetch('/api/npm-version', {
  key: 'npm-version',
  server: false,
  default: () => ({ version: null as string | null }),
})
const version = computed(() => npm.value?.version ?? null)

// The Convex figure is not copy: it is the upstream release the port currently
// matches, so it reads off the shared baseline table the component pages use,
// and a sync bump never leaves a stale number sitting in the hero.
const ported = upstreamBaselines.convex

const cells = computed(() => [
  ...(version.value ? [{ label: 'version', figure: version.value, lit: true }] : []),
  { label: 'nuxt', figure: props.nuxt },
  { label: 'vue', figure: props.vue },
  { label: 'convex', figure: props.convex },
  { label: 'ports convex', figure: ported.version },
])
</script>

<template>
  <!-- A definition list is what a nameplate IS — a name and a figure,
       five times — so a screen reader gets "nuxt ≥ 4.1" as one pair.

       The strip is a cut into the section ground (`concave-ground`: the
       ground's own tone on the floor, the walls drawing the recess), the
       same recess the hero's other readouts sit in. Its cells are keyed
       by scribed seams — chrome.css's seam pair, stood on end between
       cells and laid flat between rows — so the same markup folds to two
       columns on a phone with every seam still drawn. The version is the
       one figure that changes, and the one lit in the signal ink. -->
  <dl class="spec-strip concave-ground rounded-strip m-0">
    <div
      v-for="cell in cells"
      :key="cell.label"
      class="cell"
    >
      <dt>{{ cell.label }}</dt>
      <dd :class="{ lit: cell.lit }">
        {{ cell.figure }}
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.spec-strip {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, auto);
  inline-size: 100%;
  overflow: hidden;
}
.cell {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 0.7rem 0.46rem;
  white-space: nowrap;
  font-family: var(--font-mono);
  line-height: 1;
}
/* The seam between two cells: chrome.css's seam pair stood on end, drawn
   as a 2px pseudo on the cell's leading edge (a box-shadow could not be
   stacked with the flat seam the folded layout adds below). */
.cell {
  position: relative;
}
.cell + .cell::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 2px;
  background: linear-gradient(90deg, var(--seam-shade) 0 1px, var(--seam-catch) 1px 2px);
}
dt {
  font-size: 0.56rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  color: var(--ui-text-muted);
  text-shadow: 0 1px 0 light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.85));
}
dd {
  font-size: 0.74rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-highlighted);
  text-shadow: 0 1px 0 light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.85));
}
dd.lit {
  color: light-dark(var(--ui-color-primary-700), var(--ui-color-primary-300));
}
/* Two by two once the copy column can't hold the row — the phone case.
   The seams re-key: only the second column keeps the standing seam,
   every cell above another row gets --seam-x laid under it, and a fifth
   cell alone on the last row takes both columns. */
@container hero-copy (width < 28rem) {
  .spec-strip {
    grid-auto-flow: row;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .cell + .cell::before { display: none; }
  .cell:nth-child(even)::before { display: block; }
  /* Not in the last row: not the last cell, and not the odd cell that
     shares the last row with it. */
  .cell:not(:last-child):not(:nth-last-child(2):nth-child(odd)) { box-shadow: var(--seam-x); }
  .cell:last-child:nth-child(odd) { grid-column: span 2; }
}
@media (forced-colors: active) {
  .spec-strip,
  .cell {
    border: 1px solid;
  }
}
</style>
