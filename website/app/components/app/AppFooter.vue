<script setup lang="ts">
// Overrides Docus's AppFooter (which leaves UFooter's full-width `top` slot
// empty, so the site ended on a bare copyright line). Left/right keep Docus's
// own components — only the sitemap block above them is ours.
const appConfig = useAppConfig()

const repo = computed(() => appConfig.github?.url ?? '')

interface FooterLink { label: string, to: string, external?: boolean }
interface FooterColumn { title: string, links: FooterLink[] }

const columns = computed<FooterColumn[]>(() => [
  {
    title: 'Getting started',
    links: [
      { label: 'Introduction', to: '/getting-started/introduction' },
      { label: 'Installation', to: '/getting-started/installation' },
      { label: 'Configuration', to: '/getting-started/configuration' },
    ],
  },
  {
    title: 'Guide',
    links: [
      { label: 'Queries & mutations', to: '/guide/queries-and-mutations' },
      { label: 'Server & SSR', to: '/guide/server-and-ssr' },
      { label: 'Authentication', to: '/guide/authentication' },
      { label: 'Billing', to: '/guide/billing' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { label: 'Composables', to: '/api-reference/composables' },
      { label: 'Server utilities', to: '/api-reference/server-utilities' },
      { label: 'Playground', to: '/playground' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Source', to: repo.value, external: true },
      { label: 'Issues', to: `${repo.value}/issues`, external: true },
      { label: 'Changelog', to: `${repo.value}/blob/main/CHANGELOG.md`, external: true },
      { label: 'MIT license', to: `${repo.value}/blob/main/LICENSE`, external: true },
    ],
  },
])
</script>

<template>
  <UFooter>
    <template #top>
      <div class="af">
        <div class="af-brand">
          <p class="af-name">
            Nuxt Convex
          </p>
          <p class="af-tag">
            Convex for Vue &amp; Nuxt — a faithful port of the official
            React/Next integration, with opt-in Better Auth and Polar.
          </p>
        </div>

        <nav
          v-for="col in columns"
          :key="col.title"
          class="af-col"
          :aria-label="col.title"
        >
          <p class="af-head mono">
            {{ col.title }}
          </p>
          <ul class="af-list">
            <li
              v-for="link in col.links"
              :key="link.label"
            >
              <NuxtLink
                :to="link.to"
                :target="link.external ? '_blank' : undefined"
                :rel="link.external ? 'noopener' : undefined"
                class="af-link"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </template>

    <template #left>
      <AppFooterLeft />
    </template>

    <template #right>
      <AppFooterRight />
    </template>
  </UFooter>
</template>

<style scoped>
.af {
  max-width: 1120px;
  margin-inline: auto;
  padding: 2.75rem 1.5rem 2.25rem;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr));
  gap: 2rem 1.5rem;
}

.af-name {
  font-family: var(--display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 0.5rem;
}
.af-tag {
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--ink-dim);
  margin: 0;
  max-width: 24rem;
}

.af-head {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin: 0 0 0.85rem;
}

.af-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.af-link {
  font-size: 0.86rem;
  color: var(--ink-dim);
  text-decoration: none;
  transition: color var(--transition);
}
.af-link:hover { color: var(--accent); }
.af-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }

@media (max-width: 900px) {
  .af { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .af-brand { grid-column: 1 / -1; }
}
@media (max-width: 480px) {
  .af { grid-template-columns: minmax(0, 1fr); }
}
</style>
