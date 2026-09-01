<!-- CONVEX TEXT at display size — a title raised off the mill surface in
     the accent material, the same part the primary button is pressed
     from. Raised things are the things you act on, which is the whole
     reason this exists next to ConcaveText.vue: cut in = information,
     standing out = action.

     Structure mirrors ConcaveText.vue — two copies of the words,
     because an element's background paints under its own text-shadow.
     Inline MDC: `:convex-text[Press here]`. Everything this effect is
     lives in this file. -->
<template>
  <span class="relative inline-block max-w-full leading-none">
    <span class="ink text-transparent"><slot /></span>
    <span
      class="face pointer-events-none absolute inset-0 text-transparent select-none"
      aria-hidden="true"
    ><slot /></span>
  </span>
</template>

<style scoped>
/* The hero melt packaged for any display line: the same three-tone
   signal ramp (600/700/800 light, 300/500/600 dark — the measured 3:1
   openings) and the same crown-and-shade bevel tile, plus what the hero
   deliberately leaves out at 72px and a smaller line needs — a lit rim
   toward the light, a shaded rim away from it, and a cast pooling
   below. On dark the cast flips to a signal glow: a dark cast on a dark
   ground is invisible.

   The tile repeats every 1lh at line-height 1, phase-locked to the
   block top, on landing.css's MEASURED Technor 700 edges — re-measure
   there and these stops move with them. */
.face {
  --a: light-dark(var(--color-signal-600), var(--color-signal-300));
  --b: light-dark(var(--color-signal-700), var(--color-signal-500));
  --c: light-dark(var(--color-signal-800), var(--color-signal-600));
  --crown: light-dark(oklch(100% 0 0 / 0.2), oklch(100% 0 0 / 0.12));
  --shade: light-dark(oklch(0% 0 0 / 0.16), oklch(0% 0 0 / 0.24));
  background-image:
    /* the bevel — abridged to the bands a sub-hero size can hold:
       wrapped feet, crown plateau, baseline shade, the climb back to
       the seam */
    linear-gradient(180deg,
      var(--shade) 0% 5.5%,
      transparent 7.5% 10.7%,
      var(--crown) 12.6% 22%,
      transparent 30%,
      transparent 79.8%,
      var(--shade) 84% 85.5%,
      transparent 87.5% 96.8%,
      var(--shade) 100%),
    /* the tone */
    linear-gradient(180deg in oklch,
      var(--c) 0% 5.5%,
      var(--a) 12.6% 21.5%,
      var(--b) 84% 94.3%,
      var(--c) 98.5% 100%);
  background-size: 100% 1lh;
  background-clip: text;
  filter: drop-shadow(0 0.06em 0.22em
    light-dark(--alpha(var(--color-signal-950) / 16%),
               --alpha(var(--color-signal-500) / 20%)));
}

/* Em-scaled, so one recipe holds from a 30px h2 to a hero-size line.
   Lit rim toward the light, shaded rim away from it. */
.ink {
  --depth: 0.045em;
  --soft: 0.05em;
  text-shadow:
    0 calc(var(--depth) * -0.5) calc(var(--soft) * 0.35)
      light-dark(oklch(100% 0 0 / 0.55), oklch(100% 0 0 / 0.16)),
    0 calc(var(--depth) * -1) var(--soft)
      light-dark(oklch(100% 0 0 / 0.24), oklch(100% 0 0 / 0.08)),
    0 calc(var(--depth) * 0.5) calc(var(--soft) * 0.35)
      light-dark(--alpha(var(--color-signal-950) / 30%), oklch(0% 0 0 / 0.5)),
    0 calc(var(--depth) * 1) calc(var(--soft) * 1.2)
      light-dark(--alpha(var(--color-signal-950) / 14%), oklch(0% 0 0 / 0.3));
}

/* Forced colors would strip the backgrounds and leave transparent
   glyphs twice over — hand the in-flow copy back to the system ink and
   drop the painted double entirely. */
@media (forced-colors: active) {
  .ink {
    color: inherit;
    text-shadow: none;
  }
  .face {
    display: none;
    filter: none;
  }
}
</style>
