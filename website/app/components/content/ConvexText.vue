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
  /* THE SHADE IS THE EDGE; THE TONE IS THE DEPTH — and the tone alone
     is now the whole bottom of the gradient. --shade is black over the
     fill, so every level it spends costs chroma AND drives the foot
     below the ladder it is supposed to end on: at full depth it painted
     rgb(116,32,11), signal-800 with a quarter of black on top, chroma
     down from 119 to 105 and reading as dirt. Two passes walked it
     back; this one takes it off the foot entirely. The black is a
     shallow hump over the lower body, cresting at the baseline — the
     bottom edge of every glyph but p/g/y/j/q — and gone by the seam,
     so the descender ends on BARE --c: the ladder's own bottom rung,
     full chroma, nothing added. That is as light as this end of the
     gradient can be without shortening the ladder.

     0.09/0.14 is the crest itself, not a colour the stops divide down
     from a long way up — the fractions below read as fractions of the
     deepest point. It is a fifth of what the baseline rule used to
     spend, and the letters keep their bottom edge anyway because the
     ladder drops them from --a to --b over the same span and the .ink
     copy casts under every glyph regardless. */
  --shade: light-dark(oklch(0% 0 0 / 0.09), oklch(0% 0 0 / 0.14));
  /* The paint has to reach BELOW the last line box or the feet get no
     fill. Both gradients here are written to WRAP — the tone arrives
     at --c by 100% and holds it across the join to 5.5%, and the bevel
     is simply clear at the seam, so nothing crosses it but the tone —
     because Technor hangs its descenders past the tile to 105.5%, and
     the next tile down is what paints them.
     That is how a two-line title paints line one's p/g/y/j/q, and
     exactly what the LAST line never had: `inset-0` ends at the line
     box, so a single-line title's descenders fell outside every tile
     and the stem stopped dead at the box edge, leaving a hard step and
     a bare shadow ghost below it. Six percent of a tile clears the
     deepest foot (105.5%). In `lh`, not `em`, because it has to track
     the TILE (background-size below) — the same thing here only while
     line-height stays 1. Same fix, same figure, as ConcaveText.vue. */
  bottom: -0.06lh;
  background-image:
    /* THE BEVEL. The shadow side is one monotone roll from mid-face to
       the wrapped foot — never a spike, never a plateau it climbs back
       out of. The build before this one ran `--shade 84% 85.5%` (a
       0.7px rule at 48px), then `transparent 87.5% 96.8%`, then a
       3.2% ramp to full depth at the seam. Measured down a descender
       column in light, that painted R=200 at 80%, 166 at 84%, back up
       to 198 across 88-94%, then 132 by 100%: a dark rule at the
       baseline, a bright band under it, and a cliff falling 66 levels
       in 3px across the stem of every p and g. Two hard lines and a
       highlight between them, where the letter should just be rolling
       into shadow. (The same pass that put the descenders back on the
       tile is what exposed it — with the feet unpainted, the cliff
       had nothing to fall onto.)

       So the stops from 55% down are one shallow hump, cresting at the
       baseline and back to nothing by the seam — not a ramp to full
       depth at the foot, which is what made the descender muddy, and
       not a hump that lands on it either, which is what still left the
       bottom too heavy. A held band between two transparent stops is a
       hard edge by another name — ConcaveText.vue learned the same
       thing about its catch, and the law is the same here: a stop is a
       position the ramp passes through, not a span it sits on. There
       is no hold left at all now; 0-11.5% is clear, so the tile carries
       nothing across the seam but the tone.

       The hump falling while the tone keeps darkening is what lets the
       composite stay monotone anyway, and it is what makes the descent
       DECELERATE toward the foot instead of running off the end of it:
       measured down a descender column in light, R runs 217 at 55%,
       198 at 68%, 180 at the baseline, 172 at 90%, 163 at 96% and 157
       at the foot — a roll that eases out on bare --c, never turning
       back up and never landing below the ladder.

       The crown keeps its plateau: it spans the i-dot ceiling to the
       cap tops (12.6-22%) because those are four different letters'
       top edges, not one band across a stroke, and it measures as an
       8-level lift over 3.8px — a sheen, not a line. */
    linear-gradient(180deg,
      transparent 11.5%,
      var(--crown) 12.6% 22%,
      transparent 30%,
      transparent 55%,
      --alpha(var(--shade) / 36%) 68%,
      --alpha(var(--shade) / 76%) 78%,
      var(--shade) 84%,
      --alpha(var(--shade) / 66%) 90%,
      --alpha(var(--shade) / 26%) 96%,
      transparent 100%),
    /* the tone, and the same law: --b used to sit flat from the
       baseline to 94.3% and then jump to --c in 4.2%, which put a
       second tone step exactly where the bevel had its cliff. It ramps
       the whole way now — baseline to seam — and holds --c across the
       join so the foot carries one colour. */
    linear-gradient(180deg in oklch,
      var(--c) 0% 5.5%,
      var(--a) 12.6% 21.5%,
      var(--b) 84%,
      var(--c) 100%);
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
