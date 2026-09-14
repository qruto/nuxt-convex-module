<script setup lang="ts">
// THE TWO NAMES ON THE BOX (2026-09-14). Plate two says what Nuxt is and
// what Convex is, for the reader who knows neither, and it says it as a
// machine drawing rather than as two paragraphs: two turned parts set
// straight on the section ground with the module scribed between them
// as the coupling that joins them.
//
// The pun is the composition. Convex is a DOME — the one raised part on
// the page that stands proud without being a plate, its mark in domed
// enamel on the crown. Nuxt is the DISH the other part answers to: a
// bowl cut into the ground with its mark cut into the floor, the housing
// an app is built in. Cut in = the framework you build inside; standing
// out = the backend that pushes. Between them the line is scribed into
// the ground, and a pulse runs along it from the backend to the
// framework — "your app updates the moment its data changes", drawn.
//
// No plate anywhere on this section: every other plate on the landing
// puts its instrument in a raised box, and two more boxes here would
// have read as the tour's index and stage again.
//
// The marks are the vendors' own symbol paths (the same outlines
// BrandNuxt.vue and BrandConvex.vue carry), on their own gradient ids —
// the hero's badge gradients live in the headline's artwork and are
// bound by document order, so this section must never reuse those ids.
type Hue = 'green' | 'gold' | 'magenta' | 'red'

interface Part {
  id: 'nuxt' | 'convex'
  /** How the part is turned: cut into the ground, or standing off it. */
  face: 'cut' | 'dome'
  name: string
  role: string
  claim: string
  site: string
  href: string
  viewBox: string
  paths: Array<{ d: string, hue: Hue }>
}

const PARTS: Part[] = [
  {
    id: 'nuxt',
    face: 'cut',
    name: 'Nuxt',
    role: 'frontend',
    claim: 'The Vue framework for building web apps.',
    site: 'nuxt.com',
    href: 'https://nuxt.com',
    viewBox: '0 0 48 32',
    paths: [
      { d: 'M26.88 32H44.64C45.2068 32.0001 45.7492 31.8009 46.24 31.52C46.7308 31.2391 47.2367 30.8865 47.52 30.4C47.8033 29.9135 48.0002 29.3615 48 28.7998C47.9998 28.2381 47.8037 27.6864 47.52 27.2001L35.52 6.56C35.2368 6.0736 34.8907 5.72084 34.4 5.44C33.9093 5.15916 33.2066 4.96 32.64 4.96C32.0734 4.96 31.5307 5.15916 31.04 5.44C30.5493 5.72084 30.2032 6.0736 29.92 6.56L26.88 11.84L20.8 1.59962C20.5165 1.11326 20.1708 0.600786 19.68 0.32C19.1892 0.0392139 18.6467 0 18.08 0C17.5133 0 16.9708 0.0392139 16.48 0.32C15.9892 0.600786 15.4835 1.11326 15.2 1.59962L0.32 27.2001C0.0363166 27.6864 0.000246899 28.2381 3.05588e-07 28.7998C-0.000246288 29.3615 0.0367437 29.9134 0.32 30.3999C0.603256 30.8864 1.10919 31.2391 1.6 31.52C2.09081 31.8009 2.63324 32.0001 3.2 32H14.4C18.8379 32 22.068 30.0092 24.32 26.24L29.76 16.8L32.64 11.84L41.44 26.88H29.76L26.88 32ZM14.24 26.88H6.4L18.08 6.72L24 16.8L20.0786 23.636C18.5831 26.0816 16.878 26.88 14.24 26.88Z', hue: 'green' },
    ],
  },
  {
    id: 'convex',
    face: 'dome',
    name: 'Convex',
    role: 'backend',
    claim: 'The reactive backend platform that keeps up with you and your agents.',
    site: 'convex.dev',
    href: 'https://convex.dev',
    // The symbol's own ink box out of the lockup's frame (47.7→100.7 × 49.9→98.8).
    viewBox: '47.7 49.8 53 49.2',
    paths: [
      { d: 'M82.2808 87.6516C89.652 86.8381 96.6012 82.9352 100.427 76.421C98.6156 92.533 80.8853 102.717 66.413 96.4643C65.0795 95.8897 63.9316 94.9339 63.1438 93.705C59.8915 88.6302 58.8224 82.1729 60.3585 76.3129C64.7475 83.8398 73.6717 88.4538 82.2808 87.6516Z', hue: 'gold' },
      { d: 'M60.0895 71.5852C57.1016 78.4465 56.9722 86.4797 60.6353 93.0906C47.7442 83.453 47.8848 62.8294 60.4778 53.2885C61.6425 52.4067 63.0267 51.8833 64.4785 51.8036C70.4486 51.4907 76.5144 53.7835 80.7683 58.0561C72.1254 58.1415 63.7076 63.643 60.0895 71.5852Z', hue: 'magenta' },
      { d: 'M84.9366 60.1673C80.5757 54.1253 73.7503 50.0119 66.2722 49.8868C80.7277 43.3669 98.5086 53.9375 100.444 69.5659C100.624 71.0167 100.388 72.4959 99.7409 73.8044C97.04 79.2547 92.032 83.4819 86.1801 85.0464C90.4678 77.144 89.9388 67.4893 84.9366 60.1673Z', hue: 'red' },
    ],
  },
]

// The enamel ramps, five stops each: lit crown toward the 330° lamp, a
// lit shoulder, the vendor hue at the body, its shade, the deep shade
// away from the light. The colours are the `.enamel-*` tokens in the
// style block (OKLCH, with a wider-chroma pass on P3 screens); the dish
// runs them in REVERSE (see .mark-cut below) so the same enamel reads
// cut in rather than domed.
const STOPS = [0, 0.2, 0.5, 0.79, 1]

// One set of gradients per instance: `fill: url(#id)` resolves against
// the document, and a second copy of this section would otherwise paint
// with the first one's ramps. Only the (hue, face) pairs a path wears.
const uid = useId()
const gradientId = (hue: Hue, face: 'dome' | 'cut') => `${uid}-${hue}-${face}`
const GRADIENTS = PARTS.flatMap(part => part.paths.map(path => ({
  id: gradientId(path.hue, part.face),
  hue: path.hue,
  stops: STOPS.map((offset, index) => ({
    offset,
    color: `var(--stop-${part.face === 'cut' ? STOPS.length - 1 - index : index})`,
  })),
})))
</script>

<template>
  <div class="coupling-stage mx-auto w-full max-w-5xl">
    <!-- The enamel ramps for both faces, once, ahead of every mark. -->
    <svg
      class="absolute size-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          v-for="{ id, hue, stops } in GRADIENTS"
          :id="id"
          :key="id"
          :class="`enamel-${hue}`"
          x1="0"
          y1="0"
          x2="0.72"
          y2="1"
        >
          <stop
            v-for="{ offset, color } in stops"
            :key="offset"
            :offset="offset"
            :style="{ stopColor: color }"
          />
        </linearGradient>
      </defs>
    </svg>

    <div class="drawing">
      <figure
        v-for="part in PARTS"
        :key="part.id"
        class="part m-0"
        :class="`part-${part.face}`"
      >
        <!-- THE TURNED PART. The dish is cut into the ground, the dome
             stands off it; both carry the mark on the same axis. -->
        <div
          class="disc"
          :class="[`disc-${part.face}`, { sheen: part.face === 'dome' }]"
        >
          <svg
            :viewBox="part.viewBox"
            class="mark"
            :class="`mark-${part.face}`"
            role="img"
            :aria-label="`${part.name} mark`"
          >
            <path
              v-for="(shape, index) in part.paths"
              :key="index"
              :d="shape.d"
              :fill="`url(#${gradientId(shape.hue, part.face)})`"
            />
          </svg>
        </div>

        <figcaption class="caption">
          <p class="stamp m-0 concave-text text-dimmed">
            {{ part.role }}
          </p>
          <h3 class="m-0 font-display text-3xl font-semibold text-highlighted sm:text-4xl">
            {{ part.name }}
          </h3>
          <p class="m-0 text-base/7 text-pretty text-muted">
            {{ part.claim }}
          </p>
          <NuxtLink
            :to="part.href"
            target="_blank"
            rel="noopener"
            class="site stamp inline-flex items-center gap-1 text-lit"
          >
            {{ part.site }}
            <UIcon
              name="i-lucide-arrow-up-right"
              class="size-3"
              aria-hidden="true"
            />
          </NuxtLink>
        </figcaption>
      </figure>

      <!-- THE COUPLING. Scribed into the ground between the two parts,
           with the module as the fitting in the middle: the one raised
           part on the line, small, because it is the thing that JOINS
           the two rather than a third thing. The pulse runs backend →
           framework. -->
      <div
        class="coupling"
        aria-hidden="true"
      >
        <span class="wire wire-frame" />
        <span class="fitting part-card">
          <img
            src="/logo.svg"
            alt=""
            class="size-7"
          >
          <span class="stamp concave-text text-toned">nuxt-convex-module</span>
        </span>
        <span class="wire wire-back" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* -- The enamel -----------------------------------------------------
   Five stops per hue, crown to deep shade, in OKLCH. The base set is
   the vendors' published sRGB ramp measured exactly (the mid stop is
   the brand colour itself), so no browser gamut-maps it. On a P3
   screen every stop keeps its lightness and hue and takes the same
   share of the wider gamut's chroma that it had of sRGB's — computed,
   not eyeballed — so the enamel reads as the same colour, deeper: the
   greens gain most (+38% at the body), the golds and reds a step, the
   magentas least. Each gradient's stops read --stop-0..4 off its own
   `.enamel-*` class. */
.enamel-green {
  --stop-0: oklch(95.0% 0.074 162.6);
  --stop-1: oklch(86.9% 0.150 161.4);
  --stop-2: oklch(78.6% 0.191 155.7);
  --stop-3: oklch(65.7% 0.159 156.0);
  --stop-4: oklch(57.8% 0.138 156.5);
}
.enamel-gold {
  --stop-0: oklch(95.2% 0.059 89.4);
  --stop-1: oklch(87.9% 0.118 83.1);
  --stop-2: oklch(80.0% 0.160 80.0);
  --stop-3: oklch(68.8% 0.141 75.1);
  --stop-4: oklch(60.1% 0.123 75.1);
}
.enamel-magenta {
  --stop-0: oklch(79.2% 0.088 335.9);
  --stop-1: oklch(61.4% 0.135 339.1);
  --stop-2: oklch(45.9% 0.163 338.3);
  --stop-3: oklch(38.1% 0.137 339.2);
  --stop-4: oklch(33.5% 0.120 340.6);
}
.enamel-red {
  --stop-0: oklch(87.6% 0.065 25.3);
  --stop-1: oklch(75.5% 0.138 25.1);
  --stop-2: oklch(61.9% 0.221 27.7);
  --stop-3: oklch(52.3% 0.192 27.8);
  --stop-4: oklch(46.3% 0.170 27.6);
}
@media (color-gamut: p3) {
  .enamel-green {
    --stop-0: oklch(95.0% 0.083 162.6);
    --stop-1: oklch(86.9% 0.197 161.4);
    --stop-2: oklch(78.6% 0.265 155.7);
    --stop-3: oklch(65.7% 0.220 156.0);
    --stop-4: oklch(57.8% 0.192 156.5);
  }
  .enamel-gold {
    --stop-0: oklch(95.2% 0.072 89.4);
    --stop-1: oklch(87.9% 0.147 83.1);
    --stop-2: oklch(80.0% 0.184 80.0);
    --stop-3: oklch(68.8% 0.162 75.1);
    --stop-4: oklch(60.1% 0.142 75.1);
  }
  .enamel-magenta {
    --stop-0: oklch(79.2% 0.117 335.9);
    --stop-1: oklch(61.4% 0.150 339.1);
    --stop-2: oklch(45.9% 0.180 338.3);
    --stop-3: oklch(38.1% 0.152 339.2);
    --stop-4: oklch(33.5% 0.133 340.6);
  }
  .enamel-red {
    --stop-0: oklch(87.6% 0.085 25.3);
    --stop-1: oklch(75.5% 0.177 25.1);
    --stop-2: oklch(61.9% 0.249 27.7);
    --stop-3: oklch(52.3% 0.216 27.8);
    --stop-4: oklch(46.3% 0.191 27.6);
  }
}

/* -- The drawing ----------------------------------------------------
   Three columns past lg — housing, coupling, dome — and one column
   under it, where the coupling turns on end between the two parts.
   `--disc` is the one dimension everything else is cut from. */
.coupling-stage {
  --disc: clamp(11rem, 24vw, 16rem);
  --mark: calc(var(--disc) * 0.42);
  position: relative;
}
.drawing {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  row-gap: 1.5rem;
}
.part {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
  max-inline-size: 22rem;
  text-align: center;
}
.part-cut { order: 1; }
.coupling { order: 2; }
.part-dome { order: 3; }
@media (width >= 64rem) {
  .part-cut, .coupling, .part-dome { order: 0; }
}
.caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.caption h3 { margin-top: 0.15rem; }
.caption .site { margin-top: 0.4rem; }
@media (width >= 64rem) {
  .drawing {
    --gap: 3rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
    column-gap: var(--gap);
  }
  .part-cut { grid-area: 1 / 1; }
  .part-dome { grid-area: 1 / 2; }
  /* The coupling is laid OVER both columns on the discs' centre line —
     the discs are the first thing in each column, so that line is half
     a disc down — and padded in to where each disc's edge falls: half a
     column (a column is half the row less the gap) plus half a disc,
     plus a hair of clearance so the wire meets the part instead of
     running under it. The wires then fill from part to fitting. */
  .coupling {
    grid-area: 1 / 1 / 2 / 3;
    margin-top: calc(var(--disc) / 2);
    translate: 0 -50%;
    padding-inline: calc((100% - var(--gap)) / 4 + var(--disc) / 2 + 0.75rem);
    pointer-events: none;
  }
}

/* -- The discs ------------------------------------------------------
   One lamp overhead, the same one every part on the site is lit by.
   The DISH is the ground turned into a bowl: the wall under the lip is
   in shade, the floor holds the ground's own tone (the cut has no
   colour of its own — the ConcaveText law), and the far wall catches
   the light at the bottom. The DOME is the plate ramp bent round: a
   crown lit above centre, rolling into the plate's own shade at the
   foot, on the bevel and cast every raised part carries — one rung
   higher than a plate, because a dome stands taller than a slab. */
.disc {
  inline-size: var(--disc);
  block-size: var(--disc);
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
}
.disc-cut {
  --floor: var(--dish-body-ground);
  --wall: light-dark(rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.5));
  background:
    radial-gradient(circle at 50% 44%,
      var(--floor) 0 38%,
      color-mix(in srgb, var(--floor), #000 2%) 62%,
      color-mix(in srgb, var(--floor), #000 4.5%) 100%),
    var(--floor);
  box-shadow:
    var(--recess-lip-ground),
    inset 0 14px 22px -10px var(--wall),
    inset 0 3px 3px -1px var(--wall),
    inset 0 -12px 16px -12px light-dark(rgb(255 255 255 / 0.95), oklch(80% 0.035 65 / 0.05)),
    inset 0 -2px 0 light-dark(rgb(255 255 255 / 0.9), oklch(80% 0.035 65 / 0.02)),
    var(--dish-ground-rim);
}
.disc-dome {
  background:
    radial-gradient(circle at 50% 30%,
      var(--ui-bg-accented) 0,
      var(--ui-bg-elevated) 48%,
      color-mix(in srgb, var(--ui-bg-elevated), #000 6%) 100%);
  box-shadow:
    var(--bevel),
    var(--elevation-2),
    0 22px 30px -18px light-dark(rgb(0 0 0 / 0.28), rgb(0 0 0 / 0.7));
  transition: translate 200ms ease-out, box-shadow 200ms ease-out;
}
@media (hover: hover) {
  .part-dome:hover .disc-dome {
    translate: 0 -3px;
    box-shadow:
      var(--bevel),
      var(--elevation-3),
      0 28px 36px -18px light-dark(rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.72));
  }
}

/* -- The marks ------------------------------------------------------
   The same enamel on both, read two ways. On the dome the ramp runs
   lit-to-shade down the lamp's axis and the mark casts on the crown.
   In the dish the ramp is reversed — shade at the lamp side, light at
   the far edge — which is what a cut enamel inlay does under the same
   lamp, and the only cast it gets is the lit lip below it. */
.mark {
  inline-size: var(--mark);
  block-size: var(--mark);
  overflow: visible;
}
.mark-dome {
  filter:
    drop-shadow(0 1px 0 light-dark(rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.08)))
    drop-shadow(0 3px 4px light-dark(rgb(0 0 0 / 0.22), rgb(0 0 0 / 0.6)));
}
.mark-cut {
  filter:
    drop-shadow(0 1px 0 light-dark(rgb(255 255 255 / 0.75), rgb(255 255 255 / 0.12)))
    drop-shadow(0 -1px 0 light-dark(rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.7)));
}
@media (forced-colors: active) {
  .mark { filter: none; }
}

/* -- The coupling ---------------------------------------------------
   A scribed line (chrome.css's seam pair, stood on the ground) with a
   lit segment sliding along it: the pulse, backend → framework. The
   segment is translated, not laid out, and glows a little so a 2px
   signal reads on the grain. */
.coupling {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  inline-size: 100%;
  --lit: light-dark(var(--color-signal-500), var(--color-signal-400));
}
.fitting {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex: none;
  padding: 0.55rem 0.9rem 0.55rem 0.65rem;
  border-radius: var(--radius-well);
}
.wire {
  position: relative;
  flex: 1 1 auto;
  min-inline-size: 2.5rem;
  block-size: 2px;
  background: linear-gradient(180deg, var(--seam-shade) 0 1px, var(--seam-catch) 1px 2px);
}
.wire::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: 40%;
  border-radius: 1px;
  background: linear-gradient(90deg, transparent, var(--lit) 50%, transparent);
  box-shadow: 0 0 6px 1px --alpha(var(--lit) / 45%);
  /* Parked at the backend's end of the wire (2.5 of its own width is
     the wire's far end), unlit. It never leaves the wire: the fade
     does the arriving and leaving, so the glow never rides onto a disc. */
  translate: 150% 0;
  opacity: 0;
}
@media (width < 64rem) {
  .coupling { flex-direction: column; inline-size: auto; }
  .wire {
    inline-size: 2px;
    block-size: 3.5rem;
    min-inline-size: 0;
    background: linear-gradient(90deg, var(--seam-shade) 0 1px, var(--seam-catch) 1px 2px);
  }
  .wire::after {
    inset: auto;
    inset-inline: 0;
    inset-block-start: 0;
    inline-size: auto;
    block-size: 40%;
    background: linear-gradient(180deg, transparent, var(--lit) 50%, transparent);
    translate: 0 150%;
  }
}
@media (prefers-reduced-motion: no-preference) {
  /* One pulse every 3.2s: along the backend's wire first, then the
     framework's a beat later — the same signal crossing the fitting. */
  .wire-back::after { animation: pulse-x 3.2s ease-in-out infinite; }
  .wire-frame::after { animation: pulse-x 3.2s ease-in-out 0.5s infinite; }
  @keyframes pulse-x {
    0% { translate: 150% 0; opacity: 0; }
    10% { opacity: 1; }
    30% { opacity: 1; }
    40%, 100% { translate: 0 0; opacity: 0; }
  }
  @media (width < 64rem) {
    .wire-back::after, .wire-frame::after { animation-name: pulse-y; }
    @keyframes pulse-y {
      0% { translate: 0 150%; opacity: 0; }
      10% { opacity: 1; }
      30% { opacity: 1; }
      40%, 100% { translate: 0 0; opacity: 0; }
    }
  }
}
</style>
