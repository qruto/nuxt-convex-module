<script setup lang="ts">
// The README's head, straight from the repository: the same three SVGs the
// npm page shows, so the two heads read the same.
// Imported from the checkout rather than fetched from `main`, so a branch
// preview shows the assets it ships with.
import hero from '../../../../.github/assets/hero.svg'
import linkNpm from '../../../../.github/assets/link-npm.svg'
import linkGithub from '../../../../.github/assets/link-github.svg'

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
    <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
      <a
        :href="npm"
        target="_blank"
        rel="noopener"
      >
        <img
          :src="linkNpm"
          alt="View on npm"
          width="124"
          height="22"
        >
      </a>
      <a
        :href="github"
        target="_blank"
        rel="noopener"
      >
        <img
          :src="linkGithub"
          alt="Source on GitHub"
          width="143"
          height="22"
        >
      </a>
    </div>
  </div>
</template>
