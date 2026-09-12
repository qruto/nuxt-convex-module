<script setup lang="ts">
// A split-flap line: a fixed number of cells, each showing one character,
// and each character reached by FLIPPING through the alphabet from the one
// it showed before — the departure-board mechanism. A row that changes
// does not swap; it clatters, cell by cell, into its new text.
//
// The drum is the characters below. Each cell steps through it toward its
// target at a fixed tick, so a change ripples across the row from the left
// (cells are staggered by a few ms per column) and long swings take longer,
// exactly as on the board. Reduced motion sets the text outright.
const props = withDefaults(defineProps<{
  text: string
  /** Cells on the line; the text is padded or cut to fit. */
  cells?: number
  /** Milliseconds per flap. */
  tick?: number
}>(), { cells: 24, tick: 28 })

const DRUM = ' abcdefghijklmnopqrstuvwxyz0123456789.,!?\'-:/@#()…'
const index = (ch: string) => {
  const i = DRUM.indexOf(ch)
  return i === -1 ? 0 : i
}

function fit(text: string) {
  const lower = text.toLowerCase()
  const clipped = lower.length > props.cells ? `${lower.slice(0, props.cells - 1)}…` : lower
  return clipped.padEnd(props.cells, ' ').split('')
}

const shown = ref<string[]>(fit(props.text))
const flipping = ref<boolean[]>(Array.from({ length: props.cells }, () => false))

let timers: ReturnType<typeof setInterval>[] = []
function stopAll() {
  for (const t of timers) clearInterval(t)
  timers = []
}

function settle(target: string[]) {
  stopAll()
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    shown.value = target
    return
  }
  target.forEach((ch, col) => {
    if (shown.value[col] === ch) return
    const goal = index(ch)
    // Each cell walks the drum forward from where it sits; the stagger is
    // the mechanical delay down the row.
    const start = setTimeout(() => {
      flipping.value[col] = true
      const t = setInterval(() => {
        const at = index(shown.value[col] ?? ' ')
        const next = (at + 1) % DRUM.length
        shown.value[col] = DRUM[next]!
        if (next === goal) {
          clearInterval(t)
          flipping.value[col] = false
        }
      }, props.tick)
      timers.push(t)
    }, col * 18)
    timers.push(start as unknown as ReturnType<typeof setInterval>)
  })
}

// A blank flap still has to occupy its cell, so the empty character is a
// no-break space — written in JS rather than as a literal in the template,
// where it is invisible to anyone reading the file (and to the linter).
const display = (ch: string) => (ch === ' ' ? '\u00A0' : ch)

watch(() => props.text, text => settle(fit(text)))
onUnmounted(stopAll)
</script>

<template>
  <span
    class="flap flex gap-px"
    :aria-label="text"
  >
    <span
      v-for="(ch, col) in shown"
      :key="col"
      class="cell"
      :class="{ 'is-flipping': flipping[col] }"
      aria-hidden="true"
    >{{ display(ch) }}</span>
  </span>
</template>

<style scoped>
/* One flap: a small dark slot with the character cut into it and the
   hinge scribed across its middle. Dark on both grounds — a board's
   flaps are painted plates, not the plate they sit in — with a lit rim
   below, which is what the rest of the site's cuts carry. */
.flap {
  /* The board's own type size, independent of the row it sits in: a
     flap has to be read across the plate, and at the row's 12px the
     letters were specks on black tiles. */
  font-size: 0.98rem;
}
.cell {
  --flap: light-dark(oklch(30% 0.004 255), oklch(15% 0.004 255));
  --flap-ink: light-dark(oklch(96% 0 0), oklch(90% 0 0));
  position: relative;
  display: inline-grid;
  place-items: center;
  inline-size: 0.72em;
  block-size: 1.22em;
  flex: none;
  border-radius: 2px;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--flap), white 7%) 0 50%,
    var(--flap) 50%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    0 1px 0 light-dark(rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.05));
  color: var(--flap-ink);
  font-family: var(--font-mono);
  font-size: 0.74em;
  font-weight: 700;
  line-height: 1;
  /* The hinge. */
  &::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    top: 50%;
    block-size: 1px;
    background: rgb(0 0 0 / 0.55);
  }
}
@media (prefers-reduced-motion: no-preference) {
  .is-flipping {
    animation: flap-tick 0.056s linear infinite;
  }
  @keyframes flap-tick {
    0% { transform: scaleY(1); }
    50% { transform: scaleY(0.82); filter: brightness(1.25); }
    100% { transform: scaleY(1); }
  }
}
</style>
