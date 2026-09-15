<script setup lang="ts">
// The README's lockup, straight from the repository — the same two SVGs the
// npm page shows, picked by the OS scheme like the rest of this site.
const base = 'https://raw.githubusercontent.com/qruto/nuxt-convex-module/main/.github/assets'
</script>

<template>
  <picture class="my-8 flex justify-center">
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
</template>
