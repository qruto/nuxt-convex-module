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
    <span class="billet-ink"><slot /></span>
    <span class="billet-face" aria-hidden="true"><slot /></span>
  </span>
</template>
