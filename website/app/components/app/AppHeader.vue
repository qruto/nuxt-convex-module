<script setup lang="ts">
// Overrides Docus's AppHeader to drop the light/dark toggle. The scheme is
// the operating system's (see colorMode in nuxt.config.ts) — Docus's own
// switch for hiding the button (`docus.colorMode: 'light' | 'dark'`) would
// pin the site to one scheme instead. Everything else is Docus's markup,
// copied verbatim from docus@5.13.0 app/components/app/AppHeader.vue (its
// composables arrive through the layer's auto-imports); re-diff on a
// Docus bump. The one other change: the two icon-only buttons Docus
// renders without a name — the assistant and the menu toggle — are named:
// the assistant with its own tooltip's string, the toggle with Nuxt UI's own
// strings for its default toggle (`header.open` / `header.close`), which
// follow the locale as Docus's do. And the parts that only render in the
// mobile menu or in modes this site never turns on are Lazy-, so their
// code stays out of every page's bundle (Nuxt Hints, 2026-10-05).
import { useLocale } from '#ui/composables/useLocale'

const appConfig = useAppConfig()

const { isEnabled: isAssistantEnabled } = useAssistant()
const { isEnabled, locales, t } = useDocusI18n()
const { subNavigationMode } = useSubNavigation()
const { t: uiT } = useLocale()

const links = computed(() => appConfig.github && appConfig.github.url
  ? [
      {
        'icon': 'i-simple-icons-github',
        'to': appConfig.github.url,
        'target': '_blank',
        'aria-label': 'GitHub',
      },
    ]
  : [])
</script>

<template>
  <UHeader
    :ui="{ center: 'flex-1' }"
    :class="{ 'flex flex-col': subNavigationMode === 'header' }"
  >
    <AppHeaderCenter />

    <template #left>
      <AppHeaderLeft />
    </template>

    <template #right>
      <AppHeaderCTA />

      <template v-if="isAssistantEnabled">
        <AssistantChat :aria-label="t('assistant.tooltip')" />
      </template>

      <template v-if="isEnabled && locales.length > 1">
        <ClientOnly>
          <LazyLanguageSelect />

          <template #fallback>
            <div class="h-8 w-8 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-md" />
          </template>
        </ClientOnly>

        <LazyUSeparator
          orientation="vertical"
          class="h-8"
        />
      </template>

      <UContentSearchButton class="lg:hidden" />

      <template v-if="links?.length">
        <UButton
          v-for="(link, index) of links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #toggle="{ open, toggle }">
      <IconMenuToggle
        :open="open"
        :aria-label="open ? uiT('header.close') : uiT('header.open')"
        :aria-expanded="open"
        class="lg:hidden"
        @click="toggle"
      />
    </template>

    <!-- The mobile menu opens with the package chooser the sidebar carries
         on wide screens; below `lg` this is the only place it can live. -->
    <template #body>
      <LazyDocsPackageChooser class="mb-4" />
      <LazyAppHeaderBody />
    </template>

    <template
      v-if="subNavigationMode === 'header'"
      #bottom
    >
      <LazyAppHeaderBottom />
    </template>
  </UHeader>
</template>
