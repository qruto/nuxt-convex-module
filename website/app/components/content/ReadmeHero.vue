<script setup lang="ts">
// The README's lockup, straight from the repository — the same two SVGs the
// npm page shows, picked by the OS scheme like the rest of this site — with
// the README's npm and GitHub links under it, so the two heads read the same.
// Imported from the checkout rather than fetched from `main`, so a branch
// preview shows the assets it ships with.
import heroDark from '../../../../.github/assets/hero-dark.svg'
import heroLight from '../../../../.github/assets/hero-light.svg'
import npmMark from '../../../../.github/assets/npm.svg'
import githubMark from '../../../../.github/assets/github.svg'

const npm = 'https://www.npmjs.com/package/nuxt-convex-module'
const github = 'https://github.com/qruto/nuxt-convex-module'
</script>

<template>
  <div class="my-8 flex flex-col items-center gap-4">
    <picture class="flex justify-center">
      <source
        media="(prefers-color-scheme: dark)"
        :srcset="heroDark"
      >
      <img
        :src="heroLight"
        alt="nuxt-convex-module — the Convex module for Nuxt"
        width="560"
        height="200"
        class="max-w-full"
      >
    </picture>
    <div class="flex flex-wrap justify-center gap-x-6 gap-y-2">
      <a
        :href="npm"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 text-sm font-semibold text-muted no-underline hover:text-highlighted"
      >
        <img
          :src="npmMark"
          alt="npm"
          width="52"
          height="20"
        >
        View on npm
      </a>
      <a
        :href="github"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 text-sm font-semibold text-muted no-underline hover:text-highlighted"
      >
        <img
          :src="githubMark"
          alt="GitHub"
          width="20"
          height="20"
        >
        Source on GitHub
      </a>
    </div>
  </div>
</template>
