<script setup lang="ts">
// The spec board — a scoreboard of the four figures the module is stated
// against, one recessed readout with a cell per figure: its own published
// version, the two peer ranges, and the upstream Convex release the port
// matches. Cut into the hero directly above the calls to action, so it reads
// as the display over the controls, not as a line of the copy.
//
// The peer ranges arrive as props from the markdown (`:landing-version-chip
// {nuxt="≥ 4.1" vue="≥ 3.5"}`) — they are the page's copy, and a scoreboard
// needs them as label/figure pairs rather than as one sentence to split.
const props = defineProps<{
  /** The Nuxt range the module supports, as the page states it. */
  nuxt: string
  /** The Vue range the module supports, as the page states it. */
  vue: string
}>()

// The published version comes off the npm registry (cached server-side for an
// hour) rather than pinned in the markup — a hardcoded number is wrong from
// the next release onward. Unresolvable → the cell is dropped and the board
// closes up to three: a missing figure is honest, an invented one is not.
const { data: npm } = await useFetch('/api/npm-version', {
  key: 'npm-version',
  default: () => ({ version: null as string | null }),
})
const version = computed(() => npm.value?.version ?? null)

// The Convex figure is not copy: it is the upstream release the port currently
// matches, so it reads off the shared baseline table the component pages use,
// and a sync bump never leaves a stale number sitting in the hero.
const convex = upstreamBaselines.convex

const cells = computed(() => [
  ...(version.value ? [{ label: 'VERSION', figure: version.value }] : []),
  { label: 'NUXT', figure: props.nuxt },
  { label: 'VUE', figure: props.vue },
  { label: 'PORTS CONVEX', figure: convex.version },
])
</script>

<template>
  <!-- Its own size container: the fold to two columns queries the copy
       column the board sits in, not the viewport. -->
  <div class="spec-board">
    <!-- A definition list is what a scoreboard IS — a name over a figure,
         four times — so a screen reader gets "NUXT ≥ 4.1" as one pair. The
         dish is depth.css's shallow well, the same plate the upstream
         baseline stamps on the component pages are cut into.

         The dish is `concave-ground`: the floor is the PAGE'S own colour,
         not the well fill a plate would take. This board sits on the hero
         ground with nothing under it, so `concave`'s lighter tile read as
         a panel laid on the page rather than as a readout cut into it —
         and it is opaque, which is what stops the hero's mill grain
         carrying through the cut. With no tonal step left to see it by,
         the recess is drawn entirely by its walls: the deep well's shade
         under the lip, a floor catch, and the lip itself as
         `--recess-edge`.

         The two lines of a cell are cut and raised, not big and small: the
         LABEL is scribed into the dish (`concave-text`) because it is the
         plate's own marking, and the FIGURE stands proud of it
         (`convex-text`) because it is the reading — the part that changes.
         Neither is the loudest thing in the hero, and the figures used to
         be: black `text-highlighted` numerals pulled the eye off the
         headline and the primary call, which is exactly backwards for a
         nameplate. The ink is re-tuned for the darker floor rather than
         stepped again — figures at `text-default`, labels back up to
         `text-toned`, where `text-muted` at 8.8px went to a whisper once
         the dish stopped being the lightest thing in the hero. -->
    <dl class="board concave-ground rounded-lg m-0 border border-(--recess-edge)">
      <div
        v-for="cell in cells"
        :key="cell.label"
        class="cell grid justify-items-center gap-y-0.5 px-5 pt-2 pb-2.5 text-center"
      >
        <dt class="concave-text font-mono text-[0.55rem] font-semibold tracking-[0.18em] whitespace-nowrap text-toned">
          {{ cell.label }}
        </dt>
        <dd class="convex-text m-0 font-mono text-sm leading-tight font-semibold whitespace-nowrap text-default tabular-nums">
          {{ cell.figure }}
        </dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.spec-board {
  container-type: inline-size;
}
/* One row of cells hugging their figures, the board as wide as its
   readouts and no wider. Block-level on purpose: an inline-grid would
   sit on the copy's baseline and carry a descender gap under it. */
.board {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  inline-size: max-content;
  max-inline-size: 100%;
}
/* The cells are divided by scribed seams, not by drawn boxes: chrome.css's
   two-pixel cut stood on end — shade in the column just outside a cell's
   leading edge, catch on its first column inside — run the full height of
   the well, the way a groove in a floor runs to the walls. The cell has no
   fill of its own, so the outer half lands on the dish. */
.cell + .cell {
  box-shadow: var(--seam-y);
}
/* Two columns once the row can't hold four readouts — the phone case. The
   cells then square up to equal widths (a scoreboard's cells match), and
   the seams follow: a vertical cut opens on the right-hand column, a
   horizontal one across the top of the second row (the same cut, lying
   down: shade on the row just above, catch on the cell's own first row). */
@container (width < 22rem) {
  .board {
    grid-auto-flow: row;
    grid-auto-columns: auto;
    grid-template-columns: repeat(2, 1fr);
  }
  .cell + .cell {
    box-shadow: none;
  }
  .cell:nth-child(even) {
    box-shadow: var(--seam-y);
  }
  .cell:nth-child(n + 3) {
    box-shadow:
      0 -1px 0 var(--seam-shade),
      inset 0 1px 0 var(--seam-catch);
  }
  .cell:nth-child(even):nth-child(n + 3) {
    box-shadow:
      var(--seam-y),
      0 -1px 0 var(--seam-shade),
      inset 0 1px 0 var(--seam-catch);
  }
}
/* Forced colors strip every shadow and fill — hand the board and its
   seams back to the system ink as plain rules. */
@media (forced-colors: active) {
  .board {
    border: 1px solid;
  }
  .cell + .cell {
    border-inline-start: 1px solid;
  }
  @container (width < 22rem) {
    .cell + .cell {
      border-inline-start: 0;
    }
    .cell:nth-child(even) {
      border-inline-start: 1px solid;
    }
    .cell:nth-child(n + 3) {
      border-block-start: 1px solid;
    }
  }
}
</style>
