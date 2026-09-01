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

   The recess floor MATCHES the surface — the ground itself, cut ~14%
   deeper. That sameness is the whole illusion: a darker ink was tried
   first and read as text printed on the plate, not a recess in it. It
   is a deliberate trade — the fill alone doesn't clear a contrast
   floor, the letterform is drawn by the occlusion, the wall shading
   and the catch, and every cut title sits under a plain-ink mono
   eyebrow carrying the same section label redundantly.

   The dark cut runs deeper than the light one: a near-black ground has
   almost no room below it, so the floor alone barely separates and the
   walls do the drawing. */
.face {
  --floor: light-dark(
      color-mix(in srgb, var(--ui-bg), black 14%),
      color-mix(in srgb, var(--ui-bg), black 32%));
  /* The lip's shade and the far wall's catch, as one periodic tile:
     light held over the wrapped feet (0–5.5%), the swing up to the
     i-dot ceiling, a shade plateau across all three top-edge classes
     (12.6–30.3%), released mid x-height, then light rising through the
     baseline into the seam. Stops only ever ascend.

     The tile repeats every 1lh at line-height 1, phase-locked to the
     block top — the hero-melt trick, reusing landing.css's MEASURED
     Technor 700 edges (i-dots 12.6%, cap tops 21.5%, x-height 30.3%,
     baseline 84%, descender feet wrapped past the seam at 0–5.5%).
     Same face, same lh, same fractions; re-measure there and these
     stops move with them. A per-line tile is why a two-line title
     relights per line instead of splitting into a dark line and a
     light one. */
  --shade: light-dark(oklch(0% 0 0 / 0.34), oklch(0% 0 0 / 0.55));
  /* Dark runs the far-wall catch much harder than light: on the black
     anodize the glint IS the letterform — everything above it merges
     with the ground. */
  --catch: light-dark(oklch(100% 0 0 / 0.34), oklch(100% 0 0 / 0.38));
  background-image:
    linear-gradient(180deg,
      var(--catch) 0% 5.5%,
      transparent 7.5% 10.7%,
      var(--shade) 12.6% 30.3%,
      transparent 52%,
      transparent 68%,
      --alpha(var(--catch) / 55%) 84%,
      var(--catch) 96% 100%),
    /* a whisper of raw-metal glare across the cut — reads mostly on
       the dark scheme's exposed floor */
    linear-gradient(65deg,
      transparent 42%,
      light-dark(oklch(100% 0 0 / 0.05), oklch(100% 0 0 / 0.1)) 52%,
      transparent 60%),
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
