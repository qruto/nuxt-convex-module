<script setup lang="ts">
import LiveReactions from '../components/landing/LiveReactions.vue'

// THE SECOND WINDOW. The hero's reactions plate opens this page in a small
// popup over the landing page (utils/second-window.ts): the same instrument
// on the same table, so a key pressed in either window prints in the other
// a round trip later — the second window is the second person, and counts
// as one (useVisitor mints it its own session id). No header, no footer, no
// layout, and no plate header either: the window's own title bar says which
// window this is.
definePageMeta({ layout: false, header: false, footer: false })
useSeoMeta({ title: 'reactions · second window', robots: 'noindex' })
</script>

<template>
  <main class="grid min-h-svh place-items-center px-4 py-5">
    <figure
      class="part-plate sheen noise @container relative m-0 w-full max-w-[32rem] p-6 @max-[30rem]:p-4.5"
      aria-label="The same live reactions as the landing page, in a second window"
    >
      <LiveReactions second />
    </figure>
  </main>
</template>
