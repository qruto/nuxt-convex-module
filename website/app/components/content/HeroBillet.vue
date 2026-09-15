<!-- The hero headline's billet relief (landing.css). The relief recipe
     needs TWO copies of the line: the in-flow ink copy carries the rim
     text-shadows, the aria-hidden face carries the clipped fill — an
     element's background paints UNDER its text-shadow, so one element can
     never hold both (the same law ConvexText.vue is built on, and the same
     two-copy structure).
     Block MDC inside the hero's #title slot:

       ::hero-billet
       Use :brand-convex backend\
       in a :brand-nuxt application
       ::

     (the trailing backslash is a markdown hard break — it lands in BOTH
     copies, so the hand-placed two-line layout stays in register)

     landing.css flattens the slot's <p> wrappers with display:contents so
     the copies stay pure line boxes. -->
<script setup lang="ts">
// The ghostwrite band is the hero's only animation, and it never sleeps
// on its own: a CSS animation keeps ticking after its element has
// scrolled out of the frame, and this one drives forty-two gradient
// stops — a style pass over ~90 elements and a root-layer repaint every
// frame, for as long as the page is open (measured; see the ghostwrite
// block in landing.css). So the line reports when it is off-stage and
// landing.css pauses the band on that attribute. Client-only: `offstage`
// is false on the server, so SSR markup carries no attribute and
// hydration has nothing to disagree about.
const line = ref<HTMLElement | null>(null)
const offstage = ref(false)
let observer: IntersectionObserver | null = null
onMounted(() => {
  if (!line.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(([entry]) => {
    offstage.value = !!entry && !entry.isIntersecting
  })
  observer.observe(line.value)
})
onUnmounted(() => observer?.disconnect())

// THE BADGE RELIEF — the words' convex chain (landing.css, .billet-ink's
// seventeen text-shadows) rebuilt as one SVG filter per mark, so the two
// lockups stand off the page exactly as the letters beside them do. Every
// pass below is one text-shadow of that list, in its order: each reads the
// UNTOUCHED source and feMerge stacks them behind it — text-shadow's own
// law, and the one thing a chained CSS drop-shadow() cannot do (each of
// its passes casts from the result of the one before, which is how the
// old wall composited into a hairline; see the landing.css note).
//
// The KNOBS are QUOTES of landing.css's .hero-billet-line — a primitive's
// dx/dy/stdDeviation are attributes, so CSS cannot reach them. Move them
// together. Lengths are in em here and converted to each artwork's USER
// UNITS by its perEm (viewBox height × --brand-ratio / --brand-ref
// coefficient; brand.css), because a filter measures in the artwork's
// units and the two kits' boxes are 1.72× apart.
const DEPTH = 0.0364
const SOFTNESS = 0.0409
const LIGHT_ANGLE = 330
const HIGHLIGHT = 75
const SHADE = 55
const SIDE = 40
const SOLIDNESS = 45
const CRISP = 1 - SOLIDNESS * 0.009
// The marks' lit rims blur HALF as far as the words' (2026-09-14): the
// same softness that reads as a bevel on a letter's stroke smears to a
// white halo on an enamel lobe. Only the two light passes — shade, wall
// and casts keep the words' values, so the marks still sit at their depth.
const RIM_CRISP = 0.5
const marks = [
  { id: 'convex', perEm: 66.11 },
  { id: 'nuxt', perEm: 38.4 },
]
// TWO FILTERS PER MARK, because a wordmark and an enamel symbol are not
// the same material and the words' inks do not land the same way on both.
//   word    — the words' OWN four inks (--hi, --hi-soft, --lo, --wall),
//             flooded in by landing.css: "convex" and "Nuxt" are letters in
//             the sentence and rim, shade and wall exactly as "backend"
//             does, so the two reliefs hold the same relation to the plate
//             in both schemes. (Deriving them from the graphite instead
//             put the wall BELOW the dark plate — a black band where the
//             words show a faint one — and the marks read as standing
//             twice as high at the same offsets.)
//   symbol  — tones taken from the artwork's own pixels, so each lobe
//             rims and shades in its own hue: lifted halfway to white for
//             the lit rim, darkened to 0.68 for the shaded rim and 0.74 for
//             the wall. Shallower than the words' L-0.28 / L×0.62 on
//             purpose (2026-09-14): a saturated hue darkened that far is a
//             different colour — gold goes brown, and read as dirt under
//             the lobe on the light plate — where grey merely goes darker.
// The two casts are the GROUND's for both, like the words' (--lo-surf /
// --lo-cast). `k` is the pass's distance along the lamp in depths,
// positive toward the light.
const lit = { scale: 0.5, offset: 0.5 }
const shade = { scale: 0.68, offset: 0 }
const wall = { scale: 0.74, offset: 0 }
const alpha = {
  hi: Math.min(HIGHLIGHT * 0.01 * (1 + SOLIDNESS * 0.005), 0.98),
  hiSoft: HIGHLIGHT * 0.004,
  lo: Math.min(SHADE * 0.0075 * (1 + SOLIDNESS * 0.005), 0.96),
  wall: Math.min(SIDE * 0.016, 0.94),
}
type Pass = { name: string, k: number, blur: number, ink: string, tone?: { scale: number, offset: number }, alpha?: number }
const passes: Pass[] = [
  { name: 'hi', k: 0.5, blur: SOFTNESS * 0.35 * CRISP * RIM_CRISP, ink: 'hi', tone: lit, alpha: alpha.hi },
  { name: 'hi-soft', k: 1, blur: SOFTNESS * RIM_CRISP, ink: 'hi-soft', tone: lit, alpha: alpha.hiSoft },
  { name: 'lo', k: -0.5, blur: SOFTNESS * 0.35 * CRISP, ink: 'lo', tone: shade, alpha: alpha.lo },
  ...Array.from({ length: 12 }, (_, i) => ({
    name: `wall-${i + 1}`, k: -0.06 * (i + 1), blur: DEPTH * 0.12 * CRISP, ink: 'wall', tone: wall, alpha: alpha.wall,
  })),
  { name: 'lo-surf', k: -1, blur: SOFTNESS * 1.2, ink: 'lo-surf' },
  { name: 'lo-cast', k: -2.1, blur: SOFTNESS * 2.8, ink: 'lo-cast' },
]
const round = (n: number) => Number(n.toFixed(3))
const rad = LIGHT_ANGLE * Math.PI / 180
const relief = marks.flatMap(mark => (['word', 'symbol'] as const).map(part => ({
  id: `${mark.id}-${part}`,
  passes: passes.map(pass => ({
    ...pass,
    dx: round(Math.sin(rad) * DEPTH * mark.perEm * pass.k),
    dy: round(-Math.cos(rad) * DEPTH * mark.perEm * pass.k),
    // a CSS blur radius is twice the Gaussian's standard deviation
    sigma: round(pass.blur * mark.perEm / 2),
    matrix: part === 'symbol' && pass.tone
      ? [
          `${pass.tone.scale} 0 0 0 ${pass.tone.offset}`,
          `0 ${pass.tone.scale} 0 0 ${pass.tone.offset}`,
          `0 0 ${pass.tone.scale} 0 ${pass.tone.offset}`,
          `0 0 0 ${round(pass.alpha ?? 1)} 0`,
        ].join(' ')
      : undefined,
  })),
})))
</script>

<template>
  <span
    ref="line"
    class="hero-billet-line"
    :data-offstage="offstage || undefined"
  >
    <!-- THE GHOSTWRITE BAND's gradients — the luminance ramp each face
         lockup fills with (landing.css's ghostwrite block animates their
         stops). They live HERE, in a zero-size svg AHEAD of both copies,
         and not in the brand components' own defs, for the render loop's
         sake: url() resolves by document order, so this svg is what the
         face paths bind to, and a per-frame stop change dirties only this
         empty resource and its face-copy clients. When the gradients sat
         inside the ink copy's artwork, every frame re-rasterised the ink
         copy — seventeen text-shadows and four filter chains — and the
         hero ran at ~1fps. Measured; don't move them back.

         Each axis is userSpaceOnUse and HORIZONTAL across its
         WORDMARK's ink box — not the whole lockup's: offset 0 is the
         first letter's left edge, offset 1 the last letter's right, so
         the band's travel is normalised to the WORD the way the CSS
         original normalises to its element. (Spanning the full viewBox
         instead would spend 44% of Nuxt's pass crossing the triangle
         that the band does not paint, and land the two marks' passes at
         different speeds for no reason anyone could see.) That is the
         port's whole geometry — the CSS original is a
         `linear-gradient(90deg, ...)` sized 300%, slid by
         background-position: a flat band crossing a line of type, with
         no rake and no lamp in it. (The bar that stood here before was
         projected onto the 330 degree lamp; nothing in a ghostwrite
         shimmer is lit, so nothing in it leans.)

         TWENTY-ONE stops, because the band is DRAWN by them: a stop's
         `offset` is not a CSS property, so the moving band is a standing
         ramp whose stop colours and alphas travel (the profile is
         landing.css's ghostwrite block). The core is 0.24 of a mark wide
         and the whole band 0.6, so a 0.05 pitch puts five stops across
         the core and twelve across the band; the old bar's eleven would
         have left the core a three-stop wedge with visible facets. -->
    <svg class="billet-sweeps" width="0" height="0" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand-convex-ghost" gradientUnits="userSpaceOnUse" x1="109.78" y1="0" x2="331.77" y2="0">
          <stop offset="0" />
          <stop offset="0.05" />
          <stop offset="0.1" />
          <stop offset="0.15" />
          <stop offset="0.2" />
          <stop offset="0.25" />
          <stop offset="0.3" />
          <stop offset="0.35" />
          <stop offset="0.4" />
          <stop offset="0.45" />
          <stop offset="0.5" />
          <stop offset="0.55" />
          <stop offset="0.6" />
          <stop offset="0.65" />
          <stop offset="0.7" />
          <stop offset="0.75" />
          <stop offset="0.8" />
          <stop offset="0.85" />
          <stop offset="0.9" />
          <stop offset="0.95" />
          <stop offset="1" />
        </linearGradient>
        <linearGradient id="brand-nuxt-ghost" gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="128" y2="0">
          <stop offset="0" />
          <stop offset="0.05" />
          <stop offset="0.1" />
          <stop offset="0.15" />
          <stop offset="0.2" />
          <stop offset="0.25" />
          <stop offset="0.3" />
          <stop offset="0.35" />
          <stop offset="0.4" />
          <stop offset="0.45" />
          <stop offset="0.5" />
          <stop offset="0.55" />
          <stop offset="0.6" />
          <stop offset="0.65" />
          <stop offset="0.7" />
          <stop offset="0.75" />
          <stop offset="0.8" />
          <stop offset="0.85" />
          <stop offset="0.9" />
          <stop offset="0.95" />
          <stop offset="1" />
        </linearGradient>
      </defs>
    </svg>
    <!-- THE BADGE RELIEF filters (see the script). Their own resource svg,
         apart from the band's: the band's stops change every frame, and
         nothing that should stay rastered once belongs in the element that
         changes. text-shadow paints its first shadow on top, so the merge
         runs the list backwards and the artwork last. sRGB, so the tone
         matrices and blurs work in the space text-shadow paints in. -->
    <svg class="billet-relief" width="0" height="0" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter
          v-for="mark in relief"
          :id="`billet-relief-${mark.id}`"
          :key="mark.id"
          x="-25%"
          y="-60%"
          width="150%"
          height="220%"
          color-interpolation-filters="sRGB"
        >
          <template v-for="pass in mark.passes" :key="pass.name">
            <template v-if="!pass.matrix">
              <feFlood :data-ink="pass.ink" :result="`${pass.name}-flood`" />
              <feComposite :in="`${pass.name}-flood`" in2="SourceAlpha" operator="in" :result="`${pass.name}-ink`" />
              <feOffset :in="`${pass.name}-ink`" :dx="pass.dx" :dy="pass.dy" :result="`${pass.name}-offset`" />
            </template>
            <template v-else>
              <feOffset in="SourceGraphic" :dx="pass.dx" :dy="pass.dy" :result="`${pass.name}-moved`" />
              <feColorMatrix :in="`${pass.name}-moved`" type="matrix" :values="pass.matrix" :result="`${pass.name}-offset`" />
            </template>
            <feGaussianBlur :in="`${pass.name}-offset`" :stdDeviation="pass.sigma" :result="pass.name" />
          </template>
          <feMerge>
            <feMergeNode v-for="pass in [...mark.passes].reverse()" :key="pass.name" :in="pass.name" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
    <span class="billet-ink"><slot /></span>
    <span class="billet-face" aria-hidden="true"><slot /></span>
  </span>
</template>
