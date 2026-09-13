<script setup lang="ts">
import LiveCanvas from '../components/landing/LiveCanvas.vue'

// THE SECOND WINDOW. The hero's canvas opens this page in a small popup
// over the landing page (utils/canvas-window.ts): the same instrument
// on the same table, so a stroke in either window lands in the other a
// round trip later — the second window is the second person, and counts as
// one (useVisitor mints it its own session id). No header, no footer, no
// layout: a window this size holds the plate and nothing else. Its plate
// header is the window's title, not the instrument's — the well inside
// already says "canvas".
definePageMeta({ layout: false, header: false, footer: false })
useSeoMeta({ title: 'canvas · second window', robots: 'noindex' })
</script>

<template>
  <main class="grid min-h-svh place-items-center px-4 py-5">
    <figure
      class="part-plate sheen noise @container relative m-0 w-full max-w-[32rem] px-6 pt-5 pb-5 @max-[30rem]:px-4.5"
      aria-label="The same live canvas as the landing page, in a second window"
    >
      <header class="mb-3.5 flex items-center gap-4 stamp @max-[30rem]:gap-3">
        <span class="concave-text text-toned">second window</span>
        <span
          class="scribe flex-1"
          aria-hidden="true"
        />
        <span class="concave-text text-dimmed">same table as the page</span>
      </header>
      <LiveCanvas />
    </figure>
  </main>
</template>
