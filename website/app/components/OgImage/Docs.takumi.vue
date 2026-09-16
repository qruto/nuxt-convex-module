<!-- A documentation page's social card (og:image), rendered at build time
     and overriding Docus's Docs.takumi.vue by name. The ground, the mark
     and the footer strip are the landing card's (Landing.takumi.vue) —
     the renderer's limits are noted there; keep the two in step. -->
<script setup lang="ts">
import logo from '../../../public/logo.svg?raw'
import { version } from '../../../../package.json'

const props = defineProps<{ title?: string, description?: string, headline?: string }>()

// See Landing.takumi.vue: the display-p3 `style` halves paint the mark black.
const mark = `data:image/svg+xml;utf8,${encodeURIComponent(logo.replace(/\s*style="[^"]*"/g, ''))}`

const billet = ogBillet(66)

// The page's own description arrives through server/plugins/og-image-
// page-description.ts. Where that lookup finds nothing, what is left is
// Docus's URL-budgeted cut, which can land mid-word: a description that
// stops short of a sentence end is closed at its last whole word instead.
// (Named apart from the prop: the card renderer reads the declared props
// off the SFC's bindings, and a setup binding of the same name shadows
// the prop out of that list.)
const summary = computed(() => {
  const text = props.description?.trim() ?? ''
  if (!text || /[.!?]$/.test(text)) return text
  const cut = text.lastIndexOf(' ')
  return `${cut > 0 ? text.slice(0, cut) : text}…`
})
</script>

<template>
  <div
    class="w-full h-full flex flex-col justify-between px-[72px] py-[56px]"
    style="background: linear-gradient(330deg, #121212 0%, #1b1b1b 55%, #262626 100%); color: #fafafa;"
  >
    <div class="absolute inset-0" style="background: repeating-linear-gradient(180deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px);" />
    <div class="absolute inset-0" style="background: radial-gradient(ellipse 900px 560px at 8% 0%, rgba(255,255,255,0.075), rgba(255,255,255,0) 70%);" />

    <div class="flex items-center justify-between">
      <div class="flex items-center" style="gap: 16px;">
        <img :src="mark" width="52" height="43" style="filter: drop-shadow(2px 3px 6px rgba(0,0,0,0.55));">
        <span style="font-family: 'Kode Mono'; font-weight: 600; font-size: 26px; color: #bdbdbd; letter-spacing: 0.01em;">nuxt-convex-module</span>
      </div>
      <span
        v-if="headline"
        style="font-family: 'Kode Mono'; font-weight: 600; font-size: 22px; color: #ff5a1f; letter-spacing: 0.06em; text-transform: uppercase;"
      >{{ headline }}</span>
    </div>

    <div class="flex flex-col" style="max-width: 1000px;">
      <!-- The hero's billet relief (app/utils/og-billet.ts): ink copy under,
           face copy over. The type is set once on the wrapper, as a static
           attribute the card renderer's font scan can read, and both copies
           inherit it, so they wrap in register. -->
      <div
        class="relative flex"
        style="font-family: 'Technor'; font-weight: 700; font-size: 66px; line-height: 1.05; letter-spacing: -0.01em;"
      >
        <h1
          class="m-0"
          :style="billet.ink"
        >
          {{ title }}
        </h1>
        <div
          class="absolute inset-0"
          :style="billet.face"
        >
          {{ title }}
        </div>
      </div>
      <p
        v-if="summary"
        class="m-0"
        style="margin-top: 26px; font-family: 'Bai Jamjuree'; font-weight: 400; font-size: 30px; line-height: 1.4; color: #9c9c9c;"
      >
        {{ summary }}
      </p>
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
