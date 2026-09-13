<script setup lang="ts">
import type { CodeReveal } from '~/utils/code-reveal'
import LiveCanvas from '../landing/LiveCanvas.vue'

// THE HERO'S SIGNATURE: the code that runs the plate, and under it the
// plate running — the canvas (LiveCanvas.vue): every stroke a committed
// row, and a scrubber that drags the query's `at` argument back through the
// table's history.
//
// THE CANVAS REPLACED THE CHAT (2026-09-12). The chat was the most-shown
// Convex demo there is, and the six-scene recording that narrated it went
// with it: the code well types ONE snippet, once, and the plate is live
// from the first paint. What the canvas shows that the chat never could —
// and shows to one visitor, alone — is that a query is a function of its
// arguments and that every result is a consistent snapshot. The window key
// on the canvas opens the same instrument in a small second window on the
// same table, which is where the real-time half is felt.
//
// SSR, no-JS and reduced-motion all get the plate directly: only the
// typing arms client-side through useDemoScript. Touch anything on the
// plate mid-typing and the code lands at once.
const codeEl = ref<HTMLElement | null>(null)
let reveal: CodeReveal | null = null
const plate = ref<HTMLElement | null>(null)

// The one fence rides in from content/index.md as the default slot and
// renders through ProsePre. Typing is a reveal over the pre-highlighted DOM
// (code-reveal.ts): every character lands already wearing its token colour.
const { state } = useDemoScript(plate, async (t) => {
  reveal ??= codeEl.value ? createCodeReveal(codeEl.value) : null
  if (!reveal) return
  reveal.reset()
  await t.wait(420)
  await typeCode(t.wait, reveal)
}, { initialDelay: 500 })

// Takeover mid-typing (any pointer/key inside the plate) stops the engine;
// land the code fully on the plate.
watch(state, (value) => {
  if (value === 'stopped') reveal?.finish()
})

// The keypad in the copy sinks the key of the scene on the plate. With the
// recording gone there is one scene: the live query (useAsyncQuery, the
// "Server & SSR" key), and no key while the socket is down. Scene REQUESTS
// from the keypad have nothing to play here yet — see useHeroScene.
const heroScene = useHeroScene()
function onOnline(online: boolean) {
  heroScene.value = online ? 'LIVE' : null
}
</script>

<template>
  <!-- The instrument panel — a `part-plate`, the ONE step every plate on
       the page stands off the ground. Its own size container: the narrow
       tweaks query the panel, not the viewport.

       Capped at 32rem rather than filling the hero's right column: an
       instrument that stretches to whatever room it is given reads as a
       panel of the page instead of a part on it. `w-full` is load-bearing
       under `@container` — see the git history of this file for why a
       fit-content width collapses to the padding. -->
  <figure
    ref="plate"
    class="part-plate sheen noise @container relative mx-auto my-0 w-full max-w-[32rem] px-6 pt-5 pb-5 lg:end-4 lg:me-0 motion-safe:animate-fade-up [animation-delay:160ms] [animation-duration:700ms] @max-[30rem]:px-4.5"
    aria-label="A live Convex canvas: every painted cell is a committed row, and a scrubber reads the table as it stood at any commit"
  >
    <!-- The header is the file tab and the one key that is not a control
         of the canvas: the second window, on the same table, which is
         where the real-time half is felt (utils/canvas-window.ts). State
         has exactly one home, the rail at the foot. -->
    <header class="mb-3.5 flex items-center gap-4 stamp @max-[30rem]:gap-3">
      <span class="concave-text text-toned">app.vue</span>
      <span
        class="scribe flex-1"
        aria-hidden="true"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        class="-my-1.5 stamp text-lit hover:text-lit"
        title="open the same canvas in a second window"
        @click="openCanvasWindow"
      >
        <template #leading>
          <svg
            class="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          ><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" /><rect
            width="10"
            height="7"
            x="12"
            y="13"
            rx="2"
          /></svg>
        </template>
        try real-time
      </UButton>
    </header>

    <!-- Source well. Type is sized off the panel with a floor that keeps
         phones readable. The pre is a `part-code`: the numbered cut a
         snippet sits in. -->
    <div
      ref="codeEl"
      class="@container [&>div]:my-0 [&_button]:hidden [&_pre]:part-code [&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:px-4 [&_pre]:py-4 [&_pre]:text-[clamp(0.72rem,calc((100cqi-2rem)/37),0.875rem)] [&_pre]:leading-[1.75]"
    >
      <slot />
    </div>

    <!-- The connector — source feeds the output. -->
    <div
      class="my-2.5 flex items-center gap-2.5 stamp text-[0.58rem]"
      aria-hidden="true"
    >
      <span class="h-px flex-1 bg-linear-to-r from-transparent to-primary/30" />
      <span class="concave-text flex-none text-toned">renders</span>
      <span class="h-px flex-1 bg-linear-to-r from-primary/30 to-transparent" />
    </div>

    <!-- The canvas well and, under it, the status rail. -->
    <LiveCanvas @online="onOnline" />
  </figure>
</template>
