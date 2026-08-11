<script setup lang="ts">
// Overrides Docus's AppFooter (which leaves UFooter's full-width `top` slot
// empty, so the site ended on a bare copyright line). Left/right keep Docus's
// own components — only the sitemap block above them is ours, on the stock
// UFooterColumns.
const appConfig = useAppConfig()

const repo = computed(() => appConfig.github?.url ?? '')

const columns = computed(() => [
  {
    label: 'Getting started',
    children: [
      { label: 'Introduction', to: '/getting-started/introduction' },
      { label: 'Installation', to: '/getting-started/installation' },
      { label: 'Configuration', to: '/getting-started/configuration' },
    ],
  },
  {
    label: 'Guide',
    children: [
      { label: 'Queries & mutations', to: '/guide/queries-and-mutations' },
      { label: 'Server & SSR', to: '/guide/server-and-ssr' },
      { label: 'Authentication', to: '/guide/authentication' },
      { label: 'Billing', to: '/guide/billing' },
    ],
  },
  {
    label: 'Reference',
    children: [
      { label: 'Composables', to: '/api-reference/composables' },
      { label: 'Server utilities', to: '/api-reference/server-utilities' },
      { label: 'Playground', to: '/playground' },
    ],
  },
  {
    label: 'Project',
    children: [
      { label: 'Source', to: repo.value, target: '_blank' },
      { label: 'Issues', to: `${repo.value}/issues`, target: '_blank' },
      { label: 'Changelog', to: `${repo.value}/blob/main/CHANGELOG.md`, target: '_blank' },
      { label: 'MIT license', to: `${repo.value}/blob/main/LICENSE`, target: '_blank' },
    ],
  },
])
</script>

<template>
  <UFooter>
    <template #top>
      <UContainer>
        <UFooterColumns
          :columns="columns"
          :ui="{ label: 'etched font-mono text-[0.62rem] font-bold tracking-[0.14em] uppercase text-dimmed' }"
        >
          <template #left>
            <p class="m-0 font-display text-base font-bold text-highlighted">
              Nuxt Convex
            </p>
            <p class="m-0 mt-2 max-w-96 text-sm leading-relaxed text-toned">
              The Convex client for Vue &amp; Nuxt — live queries, mutations,
              actions, pagination, file storage and SSR, with opt-in Better
              Auth and Polar.
            </p>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <AppFooterLeft />
    </template>

    <template #right>
      <AppFooterRight />
    </template>
  </UFooter>
</template>
