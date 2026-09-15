<script setup lang="ts">
// THE TWO NAMES ON THE BOX (2026-09-14). Plate two says what Nuxt is and
// what Convex is, for the reader who knows neither, and it says it as a
// machine drawing rather than as two paragraphs: two struck medals set
// straight on the section ground, and the module as the BOX between
// them they are set into.
//
// The composition is the pun. Both parts are MEDALS — turned titanium
// discs standing off the ground, a rim round each and the mark in domed
// enamel on the field, the metal taking a faint reflection of its own
// enamel. Between them the module is a pocket CUT INTO the ground, the
// one concave part on the plate: the two medals go into the box, and
// the line scribed from each medal to it carries a pulse from the
// backend to the framework — "your app updates the moment its data
// changes", drawn.
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

// The enamel ramps, five stops each: lit crown toward the lamp, a lit
// shoulder, the vendor hue at the body, its shade, the deep shade away
// from the light. The colours are the `.enamel-*` tokens in the style
// block (OKLCH, with a wider-chroma pass on P3 screens).
const STOPS = [0, 0.2, 0.5, 0.79, 1]

// One set of gradients per instance: `fill: url(#id)` resolves against
// the document, and a second copy of this section would otherwise paint
// with the first one's ramps. One per hue a path wears.
const uid = useId()
const gradientId = (hue: Hue) => `${uid}-${hue}`
const GRADIENTS = PARTS.flatMap(part => part.paths.map(path => ({
  id: gradientId(path.hue),
  hue: path.hue,
  stops: STOPS.map((offset, index) => ({ offset, color: `var(--stop-${index})` })),
})))
</script>

<template>
  <div class="coupling-stage mx-auto w-full max-w-6xl">
    <!-- The enamel ramps, once, ahead of every mark. Lit end up: the
         one lamp every part on the site is lit by is overhead. -->
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
          x1="0.5"
          y1="-0.12"
          x2="0.5"
          y2="1.12"
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
        :class="`part-${part.id}`"
      >
        <!-- THE MEDAL, with its own enamel reflected in the metal. -->
        <div
          class="medal"
          :class="`medal-${part.id}`"
        >
          <svg
            :viewBox="part.viewBox"
            class="mark"
            role="img"
            :aria-label="`${part.name} mark`"
          >
            <path
              v-for="(shape, index) in part.paths"
              :key="index"
              :d="shape.d"
              :fill="`url(#${gradientId(shape.hue)})`"
            />
          </svg>
        </div>

        <!-- Four rows on one grid shared by both parts (see .caption):
             the medal, the role and name, the claim, the site — so the
             two claims start on the same line and the two links sit on
             the same row whatever length the claims run to. -->
        <figcaption class="caption">
          <div class="head">
            <p class="stamp label m-0 text-toned">
              {{ part.role }}
            </p>
            <h3 class="m-0 font-display text-3xl font-semibold text-highlighted sm:text-4xl">
              {{ part.name }}
            </h3>
          </div>
          <p class="m-0 text-base/7 text-pretty text-muted">
            {{ part.claim }}
          </p>
          <NuxtLink
            :to="part.href"
            target="_blank"
            rel="noopener"
            class="site stamp label inline-flex items-center gap-1 text-lit"
          >
            {{ part.site }}
            <UIcon
              name="i-lucide-arrow-up-right"
              class="size-3.5"
              aria-hidden="true"
            />
          </NuxtLink>
        </figcaption>
      </figure>

      <!-- THE COUPLING. Scribed into the ground between the two medals,
           with the module as the BOX in the middle: the one part on the
           line that is cut in rather than standing off, small, because
           it is the thing the two go INTO rather than a third thing.
           The pulse runs backend → framework. -->
      <div
        class="coupling"
        aria-hidden="true"
      >
        <span class="wire wire-frame enamel-green" />
        <span class="box">
          <img
            src="/logo.svg"
            alt=""
            class="size-7"
          >
          <span class="stamp concave-text text-toned">nuxt-convex-module</span>
        </span>
        <span class="wire wire-back enamel-red" />
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
   Three columns past lg — Nuxt, the coupling, Convex — and one column
   under it, where the coupling turns on end between the two medals.
   `--disc` is the one dimension everything else is cut from. */
.coupling-stage {
  --disc: clamp(11rem, 24vw, 16rem);
  --mark: calc(var(--disc) * 0.42);
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
  gap: 0.6rem;
  max-inline-size: 22rem;
  text-align: center;
}
.part-nuxt { order: 1; }
.coupling { order: 2; }
.part-convex { order: 3; }
@media (width >= 64rem) {
  .part-nuxt, .coupling, .part-convex { order: 0; }
}
.caption {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.15rem;
}
.caption .site { margin-top: 0.4rem; }
/* The two small readouts — role above the name, site below the claim.
   The stamp's 0.66rem is right for a figure on a dial; a label that
   names the part reads one step larger, in the toned ink rather than
   the dimmed. */
.label { font-size: 0.75rem; }
@media (width >= 64rem) {
  .drawing {
    --gap: 3rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: auto auto auto auto;
    align-items: start;
    column-gap: var(--gap);
    row-gap: 0.6rem;
  }
  /* Both parts span the four rows and hand them down to their caption
     as a subgrid, so the rows are sized across BOTH columns: the claim
     row is as tall as the taller claim, and the site row lands at the
     same height under each. Only the gaps and margins change, the flex
     stack under lg keeps the same spacing. */
  .part-nuxt { grid-area: 1 / 1 / span 4; }
  .part-convex { grid-area: 1 / 2 / span 4; }
  .part, .caption {
    display: grid;
    grid-template-rows: subgrid;
    justify-items: center;
    align-items: start;
    row-gap: 0.6rem;
  }
  .caption { grid-row: span 3; }
  /* The coupling is laid OVER both columns on the medals' centre line —
     the medals are the first thing in each column, so that line is half
     a disc down — and padded in to where each medal's edge falls: half a
     column (a column is half the row less the gap) plus half a disc,
     plus a hair of clearance so the wire meets the part instead of
     running under it. The wires then fill from medal to box. */
  .coupling {
    grid-area: 1 / 1 / 2 / 3;
    margin-top: calc(var(--disc) / 2);
    translate: 0 -50%;
    padding-inline: calc((100% - var(--gap)) / 4 + var(--disc) / 2 + 0.75rem);
    pointer-events: none;
  }
}

/* -- The medals -----------------------------------------------------
   One lamp overhead, the same one every part on the site is lit by (a
   touch above centre, as on every plate), and the same HARD cast the
   accent parts carry (`hard-cast` in depth.css): no blur in the steps,
   the depth counted in 1px steps that fade as they go, so the edge
   reads as a machined step and not a smudge.

   A struck medal: the plate's raised material on the bevel every
   raised part carries, four steps off the ground, with a RIM turned
   round the edge — a flat lip, then a step down into the field the
   mark sits on — and the field spun. The spin is the glare a turned
   surface throws: two lit sectors on the lamp's axis (0° and 180° of
   the spin) and two shaded ones across it (90°, 270°), soft, a few
   percent. The step into the field is the ground dish's recipe in
   miniature: a shade ring, then the near wall's 1px shade pushed down
   the light and the far wall's 1px catch pushed up against it, so the
   field reads cut into the medal under the same lamp. Under it all a
   soft ground cast — a medal lies on the plate, it is not machined out
   of it — and a fifth hard step that only shows on hover, when the
   medal lifts and the gap under it grows.

   And the metal REFLECTS its enamel: a faint wash of the mark's own
   colours on a layer under the mark, fading well before the rim.
   Nuxt's green in one; on the Convex medal the three hues laid round
   the spin where the three lobes are (red upper right, gold below,
   magenta left — the lobes' centres measured off the symbol's own
   paths). A reflection, not a paint: it takes the light room's near-
   white and the dark room's anodize equally, at a few percent. */
.medal {
  --rim: max(5px, calc(var(--disc) * 0.035));
  --lift: 0;
  --spun-light: light-dark(rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.05));
  --spun-shade: light-dark(rgb(0 0 0 / 0.045), rgb(0 0 0 / 0.32));
  --lip: light-dark(rgb(255 255 255 / 0.45), rgb(255 255 255 / 0.05));
  --step-shade: light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.6));
  --step-catch: light-dark(rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.07));
  /* The one hairline every body shares: a scribed line at the edge, so
     the turned part has an outline on the grain and not only a cast. */
  --keyline: 0 0 0 1px light-dark(rgb(0 0 0 / 0.1), rgb(255 255 255 / 0.09));
  position: relative;
  isolation: isolate;
  inline-size: var(--disc);
  block-size: var(--disc);
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
  background:
    radial-gradient(circle at 50% 30%,
      var(--ui-bg-accented) 0,
      var(--ui-bg-elevated) 48%,
      color-mix(in srgb, var(--ui-bg-elevated), #000 6%) 100%);
  box-shadow:
    var(--bevel),
    /* The rim: the lip, the step down, the near wall's shade (a ring
       pushed down shows only at the top), the far wall's catch (pushed
       up, only at the bottom). */
    inset 0 0 0 var(--rim) var(--lip),
    inset 0 0 0 calc(var(--rim) + 1px) var(--step-shade),
    inset 0 1px 0 calc(var(--rim) + 1px) light-dark(rgb(0 0 0 / 0.06), rgb(0 0 0 / 0.35)),
    inset 0 -1px 0 calc(var(--rim) + 1px) var(--step-catch),
    var(--keyline),
    0 1px 0 light-dark(rgb(0 0 0 / 0.14), rgb(0 0 0 / 0.6)),
    0 2px 0 light-dark(rgb(0 0 0 / 0.09), rgb(0 0 0 / 0.4)),
    0 3px 0 light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.24)),
    0 4px 0 light-dark(rgb(0 0 0 / 0.025), rgb(0 0 0 / 0.11)),
    0 5px 0 light-dark(rgb(0 0 0 / calc(var(--lift) * 0.02)), rgb(0 0 0 / calc(var(--lift) * 0.09))),
    0 8px 18px -6px light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.5));
  transition: translate 200ms ease-out;
}
/* The reflection and the spin, two layers on the field under the
   mark. Both are conic gradients (the Convex wash, and the spun glare
   on every medal), and a conic gradient pinches all its stops into one
   point at its centre — a cluster of colour, or a star of spokes,
   right where the Convex ring leaves the field bare. So both layers
   are blurred, and the spin is masked out at the centre where its
   sectors would meet. The masks are applied after the filter, so the
   blur never reaches the rim. */
.medal::before,
.medal::after {
  content: "";
  position: absolute;
  inset: calc(var(--rim) + 2px);
  z-index: -1;
  border-radius: 50%;
}
.medal::before {
  background: var(--reflection);
  filter: blur(calc(var(--disc) * 0.08));
  mask-image: radial-gradient(circle at 50% 50%, #000 0 24%, transparent 70%);
}
.medal::after {
  background:
    conic-gradient(from 0deg at 50% 50%,
      var(--spun-light) 0deg, transparent 32deg, var(--spun-shade) 90deg, transparent 148deg,
      var(--spun-light) 180deg, transparent 212deg, var(--spun-shade) 270deg, transparent 328deg,
      var(--spun-light) 360deg);
  filter: blur(calc(var(--disc) * 0.02));
  mask-image: radial-gradient(circle at 50% 50%, transparent 0 8%, #000 22%);
}
.medal-nuxt {
  --reflection: radial-gradient(circle at 50% 54%,
    light-dark(oklch(78.6% 0.191 155.7 / 0.22), oklch(78.6% 0.191 155.7 / 0.18)) 0,
    transparent 72%);
}
.medal-convex {
  --reflection: conic-gradient(from 53deg,
    light-dark(oklch(61.9% 0.221 27.7 / 0.16), oklch(61.9% 0.221 27.7 / 0.2)) 0deg,
    light-dark(oklch(80% 0.16 80 / 0.22), oklch(80% 0.16 80 / 0.2)) 102deg,
    light-dark(oklch(45.9% 0.163 338.3 / 0.14), oklch(45.9% 0.163 338.3 / 0.24)) 227deg,
    light-dark(oklch(61.9% 0.221 27.7 / 0.16), oklch(61.9% 0.221 27.7 / 0.2)) 360deg);
}
@media (hover: hover) {
  /* Hover lifts by one more step — the gap under the medal grows. */
  .part:hover .medal {
    --lift: 1;
    translate: 0 -1px;
  }
}
@media (forced-colors: active) {
  .medal::before,
  .medal::after { display: none; }
}

/* -- The marks ------------------------------------------------------
   Domed enamel on the field: the ramp runs lit-to-shade down the lamp,
   and the mark casts on the field — one lit rim, then two hard steps,
   like the medals'. */
.mark {
  inline-size: var(--mark);
  block-size: var(--mark);
  overflow: visible;
  filter:
    drop-shadow(0 1px 0 light-dark(rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.08)))
    drop-shadow(0 1px 0 light-dark(rgb(0 0 0 / 0.16), rgb(0 0 0 / 0.5)))
    drop-shadow(0 1px 0 light-dark(rgb(0 0 0 / 0.1), rgb(0 0 0 / 0.32)));
}
@media (forced-colors: active) {
  .mark { filter: none; }
}

/* -- The coupling ---------------------------------------------------
   A scribed line (chrome.css's seam pair, stood on the ground) with a
   lit segment sliding along it: the pulse, backend → framework. The
   segment is translated, not laid out, and glows a little so a 2px
   signal reads on the grain. Each wire's pulse is its own part's
   enamel — the signal leaves the backend in Convex red and arrives at
   the framework in Nuxt green — read off the same `.enamel-*` stops
   the marks paint with. The wires have NO minimum: they take whatever
   is left between the medals and the box, because a floor would
   overflow the row and run the line under the parts. */
.coupling {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  inline-size: 100%;
}
/* THE BOX. Not a card between the two parts but the pocket they are
   set into — the ground dish's recipe (`part-dish`: the lip, the two-
   step wall, the floor catch, the rim outside), cut into the section
   ground so the two wires run INTO it rather than up to it. A card by
   shape (the well radius, squircle corners); a cut has no cast. */
.box {
  --depth: concave;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex: none;
  padding: 0.8rem 1.15rem 0.8rem 0.9rem;
  border-radius: var(--radius-well);
  background: var(--gradient-recessed-ground);
  box-shadow: var(--recess-lip-ground), var(--inset-shadow-2), var(--dish-ground-floor), var(--dish-ground-rim);
  @supports (corner-shape: squircle) { corner-shape: squircle; }
}
.wire {
  --lit: var(--stop-2);
  position: relative;
  flex: 1 1 auto;
  min-inline-size: 0;
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
     does the arriving and leaving, so the glow never rides onto a medal. */
  translate: 150% 0;
  opacity: 0;
}
@media (width < 64rem) {
  .coupling { flex-direction: column; inline-size: auto; }
  .wire {
    inline-size: 2px;
    block-size: 3.5rem;
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
     framework's a beat later — the same signal crossing the box. */
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
