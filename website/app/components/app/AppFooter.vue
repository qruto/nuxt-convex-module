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
      { label: 'Security', to: '/getting-started/security' },
    ],
  },
  {
    label: 'Guide',
    children: [
      { label: 'Queries', to: '/guide/queries' },
      { label: 'Mutations', to: '/guide/mutations-and-actions' },
      { label: 'Pagination', to: '/guide/pagination' },
      { label: 'Server & SSR', to: '/guide/server-and-ssr' },
      { label: 'Auth state', to: '/guide/auth-state' },
    ],
  },
  {
    label: 'Components',
    children: [
      { label: 'Better Auth', to: '/components/better-auth' },
      { label: 'Clerk', to: '/components/clerk' },
      { label: 'Auth0', to: '/components/auth0' },
      { label: 'Polar', to: '/components/polar' },
      { label: 'Resend', to: '/components/resend' },
    ],
  },
  {
    label: 'Reference',
    children: [
      { label: 'Auto-imports', to: '/api-reference/auto-imports' },
      { label: 'Server imports', to: '/api-reference/server-imports' },
      { label: 'Modules', to: '/api-reference/reference' },
    ],
  },
  {
    label: 'Project',
    children: [
      { label: 'Source', to: repo.value, target: '_blank' },
      { label: 'Issues', to: `${repo.value}/issues`, target: '_blank' },
      { label: 'Changelog', to: `${repo.value}/blob/main/CHANGELOG.md`, target: '_blank' },
      { label: 'License', to: `${repo.value}/blob/main/LICENSE`, target: '_blank' },
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
          :ui="{ label: 'concave-text font-mono text-[0.62rem] font-bold tracking-[0.14em] uppercase text-dimmed' }"
        >
          <template #left>
            <p class="m-0 font-display text-base font-bold text-highlighted">
              Nuxt Convex
            </p>
            <p class="m-0 mt-2 max-w-96 text-sm leading-relaxed text-toned">
              The Nuxt module for Convex — live queries, mutations, actions,
              pagination, file storage and SSR, with opt-in Better Auth and
              Polar. The same client runs standalone in any Vue app.
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
