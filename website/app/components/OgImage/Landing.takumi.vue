<!-- The landing page's social card (og:image). nuxt-og-image renders it at
     build time (Docus sets `zeroRuntime`), and the name overrides Docus's
     own Landing.takumi.vue. The Docs card next door shares the ground, the
     mark and the footer strip; keep the two in step.

     The card renderer (takumi) is not a browser: Tailwind's spacing
     utilities land but its `gap-*` does not, so gaps are inline; and there
     is no `light-dark()`, `oklch()` or `color()`, so every colour is sRGB
     hex from theme.css's ramp (signal-500 = #ff5a1f). -->
<script setup lang="ts">
import logo from '../../../public/logo.svg?raw'
import { version } from '../../../../package.json'

// `description` is declared and not shown: the card is the brand poster
// and the text belongs to og:description. Docus passes it regardless, and
// the card renderer warns on every render about a passed prop the
// component does not declare.
// fallow-ignore-next-line unused-component-prop -- declared to keep nuxt-og-image quiet; the landing card shows no description by design
const props = defineProps<{ title?: string, description?: string }>()

// The headline on two balanced lines, the way the hero sets it. The
// renderer has no `text-wrap: balance`, and the line boxes a plain wrap
// gives depend on the copy, so the break is chosen here: the word
// boundary that leaves the shorter longest line.
const lines = computed(() => {
  const words = (props.title ?? '').split(' ')
  if (words.length < 4) return [words.join(' ')]
  let best: [string, string] = [words.join(' '), '']
  let bestLength = Number.POSITIVE_INFINITY
  for (let i = 1; i < words.length; i++) {
    const head = words.slice(0, i).join(' ')
    const tail = words.slice(i).join(' ')
    const length = Math.max(head.length, tail.length)
    if (length < bestLength) {
      bestLength = length
      best = [head, tail]
    }
  }
  return best
})

// The mark from the same file the header and favicons use. Its gradient
// stops carry each colour twice — an sRGB attribute plus a display-p3
// `style` — and the renderer's CSS parser fails on `color()` and paints
// the whole mark black. The attributes stand on their own, so only the
// style halves go.
const mark = `data:image/svg+xml;utf8,${encodeURIComponent(logo.replace(/\s*style="[^"]*"/g, ''))}`

const billet = ogBillet(72)

const composables = ['useQuery', 'useMutation', 'usePaginatedQuery', 'useUpload', 'useAction', 'useAsyncQuery']
</script>

<template>
  <div
    class="w-full h-full flex flex-col justify-between px-[72px] py-[56px]"
    style="background: linear-gradient(330deg, #121212 0%, #1b1b1b 55%, #262626 100%); color: #fafafa;"
  >
    <!-- The page's brushed-mill grain: one light line every third pixel. -->
    <div class="absolute inset-0" style="background: repeating-linear-gradient(180deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px);" />
    <!-- The 330° lamp: a soft pool up-left, the way the hero is lit. -->
    <div class="absolute inset-0" style="background: radial-gradient(ellipse 900px 560px at 8% 0%, rgba(255,255,255,0.075), rgba(255,255,255,0) 70%);" />

    <div class="flex items-center" style="gap: 18px;">
      <span style="font-family: 'Kode Mono'; font-weight: 600; font-size: 26px; color: #bdbdbd; letter-spacing: 0.01em;">nuxt-convex-module</span>
    </div>

    <div class="flex items-center justify-between" style="gap: 40px;">
      <div class="flex flex-col" style="max-width: 780px;">
        <!-- The hero's billet relief: ink copy under, face copy over (see
             app/utils/og-billet.ts). The type is set once on the wrapper, as a
             static attribute — the card renderer reads a component's font
             needs off static styles, so Technor 700 must be written here in
             the open — and both copies inherit it, so they overlay in register. -->
        <div
          class="relative flex"
          style="font-family: 'Technor'; font-weight: 700; font-size: 72px; line-height: 1.02; letter-spacing: -0.012em;"
        >
          <h1
            class="m-0 flex flex-col"
            :style="billet.ink"
          >
            <span
              v-for="line in lines"
              :key="line"
              style="white-space: nowrap;"
            >{{ line }}</span>
          </h1>
          <!-- The clipped fill sits on the spans: the renderer clips a
               background to an element's OWN text, not its children's. -->
          <div class="absolute inset-0 flex flex-col">
            <span
              v-for="line in lines"
              :key="line"
              :style="`white-space: nowrap; ${billet.face}`"
            >{{ line }}</span>
          </div>
        </div>
        <div class="flex flex-wrap" style="gap: 12px 12px; margin-top: 36px;">
          <span
            v-for="name in composables"
            :key="name"
            class="flex items-center rounded-lg"
            style="padding: 8px 16px; font-family: 'Kode Mono'; font-weight: 600; font-size: 23px; color: #d0d0d0; background: #171717; box-shadow: inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05);"
          >
            {{ name }}<span style="color: #ff5a1f;">()</span>
          </span>
        </div>
      </div>
      <!-- The mark stands off the plate like the hero's lockups: a cast
           shade down-right of the 330° lamp, a hairline of light on its
           lit edge. -->
      <img :src="mark" width="250" height="207" style="filter: drop-shadow(-1px -1px 0 rgba(255,255,255,0.18)) drop-shadow(6px 10px 18px rgba(0,0,0,0.6));">
    </div>

    <div class="flex items-center justify-between" style="font-family: 'Kode Mono'; font-size: 21px; color: #8a8a8a;">
      <div class="flex items-center" style="gap: 12px;">
        <span>version</span>
        <span style="color: #ff5a1f; font-weight: 600;">{{ version }}</span>
      </div>
      <span>nuxt-convex-module.dev</span>
    </div>
  </div>
</template>
