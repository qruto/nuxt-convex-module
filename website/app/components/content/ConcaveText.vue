<!-- CONCAVE TEXT at display size — a part marking cut into the mill
     surface. The deepest rung of depth.css's concave-text ladder, and
     the only one that needs a component: two copies of the words are
     unavoidable, because an element's background paints UNDER its own
     text-shadow, so one layer can never hold both the cut's shading and
     the recess floor. The in-flow copy carries the shadows on
     transparent ink; the aria-hidden overlay carries the clipped fill.

     Inline MDC: `:concave-text[Part marking]`. Display sizes only —
     below ~20px the full relief turns to mush and the plain
     `concave-text` utility is the right tool.

     Everything this effect is lives in this file. Its convex twin is
     ConvexText.vue; the two share only the shape of the markup, which
     is written in plain utilities right here rather than in a stylesheet
     neither of them owns. -->
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
/* Light comes from directly overhead (the depth.css law), so every
   shadow vector here is vertical.

   The recess floor is the ground itself, cut deeper — ~22% in light,
   ~32% in dark. It sat at 14% for a long while, on the argument that a
   floor MATCHING the surface is the whole illusion (a darker ink was
   tried before that and read as text printed on the plate, not a
   recess in it). But 14% left the FEET of the letters — the one band
   no wall shading falls on — within a hair of the plate: measured on
   the spec sheet, a stem ran 168 at the cap tops to 202 at the
   baseline against a 226–238 ground, so the title faded out from the
   top down and read as a gradient rather than a cut. The floor goes
   deeper and the walls step back to meet it (see --shade below): the
   letterform is still drawn by the occlusion and the wall shading, but
   the fill now carries enough of the letter to hold at the baseline.
   The landing sections carry no eyebrow above these titles, so the
   relief alone has to keep them legible.

   The dark cut runs deeper still: a near-black ground has almost no
   room below it, so the floor alone barely separates and the walls do
   the drawing. */
.face {
  --floor: light-dark(
      color-mix(in srgb, var(--ui-bg), black 22%),
      color-mix(in srgb, var(--ui-bg), black 32%));
  /* The paint has to reach BELOW the last line box or the descenders
     get no fill at all. Technor hangs them past the tile (to 105.5%),
     so their feet are painted by the NEXT tile down — which is how a
     two-line title paints line one's y/g/p/j/q, and exactly what the
     LAST line never had: `inset-0` ends at the line box, so its
     descenders fell outside every tile and came out as unpainted
     ghosts, lit only by the ink copy's white under-rim. Six percent of
     a tile of overhang clears the deepest foot. In `lh`, not `em`,
     because it has to track the TILE (background-size below), which is
     the same thing here only while line-height stays 1. */
  bottom: -0.06lh;
  /* The lip's shade and the far wall's catch, as one periodic tile.
     Light falls straight down, so a cut glyph is drawn by a SHADE
     under its top edge fading down the floor, and a CATCH on the one
     wall that faces up, at the bottom edge.

     EVERY STOP IS A RAMP. Two earlier builds banded this gradient —
     a `--catch` held flat from 84% to 88%, a `--shade` plateau across
     12.6–30.3% — and a held band between two transparent stops is a
     hard edge by another name: at display size the catch printed as a
     white stripe ruled straight through the feet of every letter, and
     the eye read a highlight painted ON the words rather than a wall
     inside them. A cut has no edges of its own; only the letterform
     does. So each stop here is a single position the ramp passes
     through, never a span it sits on, and the catch runs at a fifth
     of its old alpha — the far wall brightens toward the baseline
     instead of glinting at it. The relief that survives that is the
     one the `.ink` copy casts anyway.

     No third layer either: a 65° "raw-metal glare" used to ride on
     top of these. An angled gradient is measured across the whole box,
     and the box here is one line tall and as wide as the words — at
     665×48 a 65° axis is all but vertical, so the glare landed as a
     pale vertical smear over whichever words happened to sit mid-line,
     and it moved with every title's length. Nothing about a cut is
     horizontal; don't put an angle back on a box this flat.

     Reading down one tile: the descender's foot-wall carried in from
     the line above (0%, easing out by the i-dot ceiling), the shade
     coming to full depth under the cap tops (21.5%) and easing off
     down the body, then the far wall lifting to the baseline (86%) and
     holding that lift across the seam — 100% and 0% carry the same
     value, so the descender shank crosses the tile join with nothing
     to see, and a tile can hold no stop past 100% anyway.

     The tile repeats every 1lh at line-height 1, phase-locked to the
     block top — the hero-melt trick, reusing landing.css's MEASURED
     Technor 700 edges (i-dots 12.6%, cap tops 21.5%, x-height 30.3%,
     baseline 84%, descender bottoms 105.5%). Same face, same lh, same
     fractions; re-measure there and these stops move with them. A
     per-line tile is why a two-line title relights per line instead of
     splitting into a dark line and a light one. */
  /* The LIGHT walls run soft. At 0.34 shade over 0.13 catch the light
     cut still read as a two-tone gradient — a dark band across the cap
     tops over a bleached band at the feet — with the floor lost
     between them; the eye took the two bands for the ink's colours
     and the words looked printed in a fade rather than cut. The shade
     IS the top colour and the catch IS the bottom one, so both step
     down together, keeping their ratio, and the floor carries most of
     the letter with the walls only tilting it.

     They stepped down a second time — 0.2 / 0.07 to the figures here —
     when the floor went deeper. A deeper floor under the old walls
     would only have driven the cap tops darker; the walls give back
     what the floor took, so the TOP colour lands where it always did
     and what changes is the range down to the baseline, which is the
     end that was washing out. The dark figures stay where they were:
     on the black anodize the floor barely separates from the ground
     and the walls are the letterform, so the same step down there
     (tried at 0.42 / 0.22) only dimmed the title. */
  --shade: light-dark(oklch(0% 0 0 / 0.13), oklch(0% 0 0 / 0.55));
  /* Dark still runs the far wall harder than light — on the black
     anodize the lift toward the baseline is most of what separates a
     letter from the ground — but it is a lift, not a glint. */
  --catch: light-dark(oklch(100% 0 0 / 0.05), oklch(100% 0 0 / 0.32));
  background-image:
    linear-gradient(180deg,
      --alpha(var(--catch) / 65%) 0%,
      transparent 9.5%,
      var(--shade) 21.5%,
      --alpha(var(--shade) / 58%) 40%,
      --alpha(var(--shade) / 22%) 58%,
      transparent 73%,
      var(--catch) 86%,
      --alpha(var(--catch) / 65%) 100%),
    linear-gradient(var(--floor), var(--floor));
  background-size: 100% 1lh;
  background-clip: text;
}

/* Em-scaled, so one recipe holds from a 30px h2 to a hero-size line —
   the text-depth playground's own proportions (4.5px at 110px).
   Occlusion tucked under the top lip (toward the light), then the
   surface edge below the recess catching the overhead ray. */
.ink {
  --depth: 0.045em;
  --soft: 0.05em;
  text-shadow:
    0 calc(var(--depth) * -0.4) calc(var(--soft) * 0.3)
      light-dark(oklch(15% 0 0 / 0.46), oklch(0% 0 0 / 0.75)),
    0 calc(var(--depth) * -0.85) calc(var(--soft) * 1.1)
      light-dark(oklch(15% 0 0 / 0.2), oklch(0% 0 0 / 0.4)),
    0 calc(var(--depth) * 0.5) calc(var(--soft) * 0.35)
      light-dark(oklch(100% 0 0 / 0.85), oklch(100% 0 0 / 0.19)),
    0 calc(var(--depth) * 0.9) var(--soft)
      light-dark(oklch(100% 0 0 / 0.4), oklch(100% 0 0 / 0.1));
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
  }
}
</style>
