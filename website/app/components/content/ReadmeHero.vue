<script setup lang="ts">
// The README's head: its lockup straight from the repository, the same SVG
// the npm page shows, and its npm and GitHub links as the site's own links,
// so the two heads read the same.
// Imported from the checkout rather than fetched from `main`, so a branch
// preview shows the asset it ships with.
import hero from '../../../../.github/assets/hero.svg'

const npm = 'https://www.npmjs.com/package/nuxt-convex-module'
const github = 'https://github.com/qruto/nuxt-convex-module'
</script>

<template>
  <div class="my-8 flex flex-col items-center gap-4">
    <img
      :src="hero"
      alt="nuxt-convex-module — the Convex module for Nuxt"
      width="560"
      height="200"
      class="max-w-full"
    >
    <p class="flex flex-wrap justify-center gap-x-3 gap-y-2">
      <ProseA :href="npm">
        View on npm
      </ProseA>
      <span
        class="text-muted"
        aria-hidden="true"
      >·</span>
      <ProseA :href="github">
        Source on GitHub
      </ProseA>
    </p>
  </div>
</template>
