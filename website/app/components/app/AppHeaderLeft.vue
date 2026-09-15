<script setup lang="ts">
// Overrides Docus's AppHeaderLeft to set the module's name beside the
// mark: with `header.logo` configured, Docus shows the logo alone. Copied
// from docus@5.13.0 app/components/app/AppHeaderLeft.vue plus the name;
// re-diff on a Docus bump.
const appConfig = useAppConfig()
const site = useSiteConfig()
const { localePath } = useDocusI18n()

const ariaLabel = appConfig.header?.title || site.name
</script>

<template>
  <NuxtLink
    :to="localePath('/')"
    :aria-label="ariaLabel"
    class="flex items-center gap-2.5"
  >
    <AppHeaderLogo class="h-6 w-auto shrink-0" />
    <span class="convex-text font-mono text-[0.8125rem] font-semibold tracking-tight whitespace-nowrap text-highlighted">nuxt-convex-module</span>
  </NuxtLink>
</template>
