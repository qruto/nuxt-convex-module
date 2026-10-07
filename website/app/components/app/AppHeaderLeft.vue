<script setup lang="ts">
// Overrides Docus's AppHeaderLeft to set the module's name beside the
// mark: with `header.logo` configured, Docus shows the logo alone. Copied
// from docus@5.13.0 app/components/app/AppHeaderLeft.vue plus the name;
// re-diff on a Docus bump. The link is named by the name it shows — Docus
// labels it with the site title, and a label that leaves out the visible
// words is the one a voice user cannot say (WCAG 2.5.3, label in name).
const { localePath } = useDocusI18n()

const name = 'nuxt-convex-module'
</script>

<template>
  <NuxtLink
    :to="localePath('/')"
    :aria-label="name"
    class="flex items-center gap-2.5"
  >
    <AppHeaderLogo class="h-6 w-auto shrink-0" />
    <span class="convex-text-2 font-mono text-[0.8125rem] font-semibold tracking-tight whitespace-nowrap text-highlighted">{{ name }}</span>
  </NuxtLink>
</template>
