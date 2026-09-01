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
<template>
  <span class="hero-billet-line">
    <!-- THE LIGHT BAR's gradients — the sweep each face lockup fills with
         (landing.css's light-bar block animates their stops). They live
         HERE, in a zero-size svg AHEAD of both copies, and not in the
         brand components' own defs, for the render loop's sake: url()
         resolves by document order, so this svg is what the face paths
         bind to, and a per-frame stop change dirties only this empty
         resource and its face-copy clients. When the gradients sat inside
         the ink copy's artwork, every frame of the shine re-rasterised
         the ink copy — seventeen text-shadows and four filter chains —
         and the hero ran at ~1fps. Measured; don't move them back.

         Each axis is userSpaceOnUse over its artwork's ink box projected
         onto (0.940, 0.342) — 20° off vertical, the lean the 330° lamp
         throws — endpoints at that projection's min/max corner, so offset
         0 is exactly where the band enters the mark and offset 1 exactly
         where it leaves. Eleven stops because the band is DRAWN by them:
         a stop's `offset` is not a CSS property, so the moving bar is a
         standing ramp whose stop-opacities travel (the bearings and lobes
         are landing.css's light-bar block). -->
    <svg class="billet-sweeps" width="0" height="0" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand-convex-sweep" gradientUnits="userSpaceOnUse" x1="59.9" y1="21.8" x2="325.3" y2="118.4">
          <stop offset="0" />
          <stop offset="0.1" />
          <stop offset="0.2" />
          <stop offset="0.3" />
          <stop offset="0.4" />
          <stop offset="0.5" />
          <stop offset="0.6" />
          <stop offset="0.7" />
          <stop offset="0.8" />
          <stop offset="0.9" />
          <stop offset="1" />
        </linearGradient>
        <linearGradient id="brand-nuxt-sweep" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="123.3" y2="44.9">
          <stop offset="0" />
          <stop offset="0.1" />
          <stop offset="0.2" />
          <stop offset="0.3" />
          <stop offset="0.4" />
          <stop offset="0.5" />
          <stop offset="0.6" />
          <stop offset="0.7" />
          <stop offset="0.8" />
          <stop offset="0.9" />
          <stop offset="1" />
        </linearGradient>
      </defs>
    </svg>
    <span class="billet-ink"><slot /></span>
    <span class="billet-face" aria-hidden="true"><slot /></span>
  </span>
</template>
