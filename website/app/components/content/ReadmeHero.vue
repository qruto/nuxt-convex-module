<script setup lang="ts">
// The README's lockup, straight from the repository — the same two SVGs the
// npm page shows, picked by the OS scheme like the rest of this site — with
// the README's npm link under it, so the two heads read the same.
const base = 'https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets'
const npm = 'https://www.npmjs.com/package/nuxt-convex-module'
</script>

<template>
  <div class="my-8 flex flex-col items-center gap-4">
    <picture class="flex justify-center">
      <source
        media="(prefers-color-scheme: dark)"
        :srcset="`${base}/hero-dark.svg`"
      >
      <img
        :src="`${base}/hero-light.svg`"
        alt="nuxt-convex-module — the Convex module for Nuxt"
        width="560"
        height="200"
        class="max-w-full"
      >
    </picture>
    <a
      :href="npm"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-2 text-sm font-semibold text-muted no-underline hover:text-highlighted"
    >
      <img
        :src="`${base}/npm.svg`"
        alt="npm"
        width="52"
        height="20"
      >
      View on npm
    </a>
  </div>
</template>
