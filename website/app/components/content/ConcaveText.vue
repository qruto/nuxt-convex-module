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
<script setup lang="ts">
/* One filter per instance: `filter: url(#id)` resolves against the
   document, and four titles sharing one id would all point at
   whichever copy came first. */
const cutId = useId()
</script>

<template>
  <span class="relative inline-block max-w-full leading-none">
    <span class="ink text-transparent"><slot /></span>
    <span
      class="face pointer-events-none absolute inset-0 text-transparent select-none"
      :style="{ '--cut': `url(#${cutId})` }"
      aria-hidden="true"
    ><slot /></span>
    <!-- THE DARK CUT'S WALLS (2026-09-12). Dark only — see .face below
         for why. An inner shadow that follows the glyph: the lip's
         occlusion is the letter minus itself pushed DOWN (the band
         under every top edge, whatever its shape), softened a hair
         and clipped back to the letter so nothing spills onto the
         plate; the far wall's catch is the letter minus itself pushed
         UP (the band above every bottom edge), left crisp. The shade
         eased from 2.8px at 0.78 to 2.2px at 0.55 on the user's call
         ("make it less", 2026-09-12): the deeper cut read as the plate
         being thick rather than the letter being cut. Pixels, not
         ems: the titles run 30–48px, and 2.2px is 0.05–0.07em across
         that — the same cut at every size, which is what a machined
         depth is. Fixed sizes also keep two-line titles identical to
         one-line ones, which objectBoundingBox units would not. -->
    <svg class="absolute size-0" aria-hidden="true">
      <filter :id="cutId" color-interpolation-filters="sRGB">
        <feOffset in="SourceAlpha" dy="2.2" result="down" />
        <feComposite in="SourceAlpha" in2="down" operator="out" result="lip" />
        <feGaussianBlur in="lip" stdDeviation="1" result="lip-soft" />
        <feComposite in="lip-soft" in2="SourceAlpha" operator="in" result="lip-in" />
        <feFlood flood-color="#000" flood-opacity="0.55" result="shade-ink" />
        <feComposite in="shade-ink" in2="lip-in" operator="in" result="shade" />
        <feOffset in="SourceAlpha" dy="-1.2" result="up" />
        <feComposite in="SourceAlpha" in2="up" operator="out" result="foot" />
        <feFlood flood-color="#fff" flood-opacity="0.1" result="catch-ink" />
        <feComposite in="catch-ink" in2="foot" operator="in" result="catch" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="catch" />
          <feMergeNode in="shade" />
        </feMerge>
      </filter>
    </svg>
  </span>
</template>

<style scoped>
/* Light comes from directly overhead (the depth.css law), so every
   shadow vector here is vertical.

   In light the recess floor is the ground itself, cut deeper — ~22%
   toward black. It sat at 14% for a long while, on the argument that a
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

   THE DARK FLOOR IS LIT (2026-09-12). On a ~25/255 plate there is no
   room below: every darker floor tried (black 45%, then 48%, then a
   near-black hole) came out as glossy black type with a halo, because
   a fill within a few points of black has nowhere left for the shade
   to go and the eye reads the lit rim under it as a drop shadow. So
   the dark floor goes the OTHER way — 25% toward white, ~75/255 — and
   the recess is drawn by its walls: a dark occlusion under every top
   edge (the SVG filter in the template, applied below), a dark line
   on the plate above the letter, and a lit edge under it. That is the
   dark-room reading of a cut — the floor catches the overhead lamp,
   the lip shades the near end of it — and it is the one a lighter
   floor lacked when it was tried on 2026-09-07 with only the straight
   tile for walls: it read then as pale type printed on the plate,
   which is what a lit floor is WITHOUT an occlusion that follows the
   glyph. The occlusion is what makes it a cut; the floor is what
   makes it legible. */
.face {
  --floor: light-dark(
      color-mix(in srgb, var(--ui-bg), black 22%),
      color-mix(in srgb, var(--ui-bg), white 25%));
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
     end that was washing out.

     Dark runs the tile at a tilt only (0.5 -> 0.18, 2026-09-12): the
     filter's occlusion draws the edge under every top, so the straight
     band's job is just to keep the floor a shade darker at the cap
     tops than at the feet — the lamp reaching less of the near end.
     At 0.5 the two stacked and the caps went back to black. */
  --shade: light-dark(oklch(0% 0 0 / 0.13), oklch(0% 0 0 / 0.18));
  /* The far wall's straight band, at the same whisper in both schemes.
     Dark used to run it harder than light — on a near-black floor the
     lift toward the baseline was most of what separated a letter from
     the ground — and every figure above 0.13 came out as a pale band
     across the FEET of the letters, type printed in a fade from black
     to silver. It is a wall catching light where it turns, so the ramp
     runs 82% to 90% (not from 73%, which lit the bottom quarter) and
     the wrap stop is 30% of the catch so the descender shank crosses
     the tile join dark. Down to 0.05 with the lit floor (2026-09-12):
     the far wall's lift now follows the glyph inside the filter, and
     over a 75/255 floor a straight band had nothing left to add. */
  --catch: light-dark(oklch(100% 0 0 / 0.05), oklch(100% 0 0 / 0.05));
  background-image:
    linear-gradient(180deg,
      --alpha(var(--catch) / 30%) 0%,
      transparent 9.5%,
      var(--shade) 21.5%,
      --alpha(var(--shade) / 58%) 40%,
      --alpha(var(--shade) / 22%) 58%,
      transparent 82%,
      var(--catch) 90%,
      --alpha(var(--catch) / 30%) 100%),
    linear-gradient(var(--floor), var(--floor));
  background-size: 100% 1lh;
  background-clip: text;
  /* THE WALLS THAT FOLLOW THE GLYPH (dark only). The tile above shades
     every line with one straight ramp — right for a baseline, wrong
     for the bowl of an e or the foot of a g. On light the floor
     carries the letter and the tile only tilts it, so that never
     showed; on dark the walls ARE the cut, and a wall that ignores the
     letterform read as a black smear across the stems at x-height.

     Two builds of shape-following walls came before this one and both
     are ruled out. A text-shadow on THIS copy (2026-09-07) paints
     above the clipped fill, so a shifted copy of the glyph does land
     inside the letter — but it lands OUTSIDE it too: the part of the
     shifted glyph that misses the original prints on the plate as a
     band under every letter (verified on a bare page: the spill is
     there, background-clip clips only the background). Blurred it was
     a halo, crisp it was an extrusion. And no shifted copy at all
     (2026-09-07, "the dark cut is a hole") left the black floor above.

     An SVG filter is the one thing on the platform that can subtract
     a glyph from itself and clip the result back to the glyph — an
     inner shadow with no spill. It runs on this copy only, so the ink
     copy's lines on the plate stay exactly where they are; Chrome and
     real Safari 26.6 both apply `filter: url()` to an HTML element's
     clipped background (checked the same day). The
     filter is in the template; only its handle is a style, and only
     dark uses it — light's floor and tile were already right. */
  :root.dark & {
    filter: var(--cut);
  }
}

/* Em-scaled, so one recipe holds from a 30px h2 to a hero-size line —
   the text-depth playground's own proportions (4.5px at 110px).
   Occlusion tucked under the top lip (toward the light), then the
   surface edge below the recess catching the overhead ray.

   The lit edge runs CRISP — zero blur on both white passes
   (2026-09-06). Blurred, the white rim smeared out into the ground and
   the cut read shallower than it is; a surface edge catching light is
   a hard line, so only the occlusion keeps its softness.

   THE DARK INK IS TWO LINES (2026-09-12). A black line one pixel
   above the letter — the lip's shadow on the plate, the only mark a
   cut leaves outside itself on the lamp side — and a lit edge one
   pixel below it. Nothing blurred, nothing pooled: the soft black cast
   that used to sit under the dark titles is what made them read as
   raised black type (a recess casts nothing on the plate, an
   extrusion does), and every white pass wider than a pixel stacked
   with the floor's own lift into a silver pad. Fixed pixels rather
   than ems for the same reason as the filter: the walls are a
   machined depth, the same on a 30px line as a 48px one. */
.ink {
  --depth: 0.045em;
  --soft: 0.05em;
  text-shadow:
    0 calc(var(--depth) * -0.4) calc(var(--soft) * 0.3) oklch(15% 0 0 / 0.46),
    0 calc(var(--depth) * -0.85) calc(var(--soft) * 1.1) oklch(15% 0 0 / 0.2),
    0 calc(var(--depth) * 0.5) 0 oklch(100% 0 0 / 0.85),
    0 calc(var(--depth) * 0.9) 0 oklch(100% 0 0 / 0.4);
  :root.dark & {
    text-shadow:
      0 -1px 0 oklch(0% 0 0 / 0.7),
      0 1px 0 oklch(100% 0 0 / 0.14);
  }
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
