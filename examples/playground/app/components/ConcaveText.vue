<!-- Text cut into the surface it sits on: the website's ConcaveText, for
     display sizes (20px and up). It takes two copies of the words, because an
     element's background paints under its own text-shadow: the in-flow copy
     draws the walls outside the letters, the hidden copy fills the letters
     with the floor. -->
<script setup lang="ts">
// One filter per instance: `url(#id)` resolves against the whole document.
const cutId = useId()
</script>

<template>
  <span class="concave-text">
    <span class="ink"><slot /></span>
    <span class="face" :style="{ '--cut': `url(#${cutId})` }" aria-hidden="true"><slot /></span>
    <!-- Dark only: a shade under every top edge and a catch over every
         bottom one, following the letterforms and clipped to them. -->
    <svg aria-hidden="true">
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
.concave-text {
  position: relative;
  display: inline-block;
  max-width: 100%;
  line-height: 1;
}

/* The floor is the surface taken down (light) or up (dark) far enough to
   hold about 3:1 at display size; the walls draw the cut. */
.face {
  --floor: light-dark(
    color-mix(in srgb, var(--surface), #000 44%),
    color-mix(in srgb, var(--surface), #fff 42%));
  --shade: light-dark(rgb(0 0 0 / 0.13), rgb(0 0 0 / 0.18));
  --catch: rgb(255 255 255 / 0.05);
  position: absolute;
  inset: 0;
  /* Reaches past the last line box so its descenders get a floor too. */
  bottom: -0.06lh;
  color: transparent;
  pointer-events: none;
  user-select: none;
  /* One tile per line, stopped at Technor's measured edges (cap tops 21.5%,
     baseline 84%): shade under the top lip easing down the floor, then the
     far wall lifting toward the baseline. */
  background-image:
    linear-gradient(180deg,
      color-mix(in srgb, var(--catch) 30%, transparent) 0%,
      transparent 9.5%,
      var(--shade) 21.5%,
      color-mix(in srgb, var(--shade) 58%, transparent) 40%,
      color-mix(in srgb, var(--shade) 22%, transparent) 58%,
      transparent 82%,
      var(--catch) 90%,
      color-mix(in srgb, var(--catch) 30%, transparent) 100%),
    linear-gradient(var(--floor), var(--floor));
  background-size: 100% 1lh;
  background-clip: text;
}

/* Occlusion above each letter, the lit edge below it. */
.ink {
  --depth: 0.045em;
  --soft: 0.05em;
  color: transparent;
  text-shadow:
    0 calc(var(--depth) * -0.4) calc(var(--soft) * 0.3) oklch(15% 0 0 / 0.46),
    0 calc(var(--depth) * -0.85) calc(var(--soft) * 1.1) oklch(15% 0 0 / 0.2),
    0 calc(var(--depth) * 0.5) 0 oklch(100% 0 0 / 0.85),
    0 calc(var(--depth) * 0.9) 0 oklch(100% 0 0 / 0.4);
}

svg {
  position: absolute;
  width: 0;
  height: 0;
}

@media (prefers-color-scheme: dark) {
  .face {
    filter: var(--cut);
  }

  .ink {
    text-shadow:
      0 -1px 0 oklch(0% 0 0 / 0.7),
      0 1px 0 oklch(100% 0 0 / 0.14);
  }
}

/* Forced colours strip the fill and would leave the words transparent twice
   over: hand the in-flow copy back to the system ink. */
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
