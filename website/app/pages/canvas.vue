<script setup lang="ts">
import LiveCanvas from '../components/landing/LiveCanvas.vue'

// THE CANVAS, KEPT (2026-09-15): it was the hero's instrument until the
// reactions took the plate, and it lives on here whole — the same
// component, the same table (convex/canvas.ts) — so it can come back or be
// linked to. This was its second window: the hero opened it in a small popup
// over the landing page (utils/second-window.ts): the same instrument
// on the same table, so a stroke in either window lands in the other a
// round trip later — the second window is the second person, and counts as
// one (useVisitor mints it its own session id). No header, no footer, no
// layout, and no plate header either: the window's own title bar says
// which window this is, and the well inside says "canvas" (2026-09-13:
// "second window · same table as the page" was stating the obvious).
definePageMeta({ layout: false, header: false, footer: false })
useSeoMeta({ title: 'canvas · second window', robots: 'noindex' })
</script>

<template>
  <main class="grid min-h-svh place-items-center px-4 py-5">
    <figure
      class="part-plate sheen noise @container relative m-0 w-full max-w-[32rem] p-6 @max-[30rem]:p-4.5"
      aria-label="The same live canvas as the landing page, in a second window"
    >
      <LiveCanvas second />
    </figure>
  </main>
</template>
