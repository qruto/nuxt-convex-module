<script setup lang="ts">
// Overrides Docus's app.vue for what every page loads before anything else.
// Copied from docus@5.13.0 app/app.vue (its helpers arrive through the
// layer's auto-imports); re-diff on a Docus bump. Two changes, and the
// `seo.titleTemplate` line goes: this site never sets one, and its type is
// declared only inside Docus.
//
// 1. Only the English Nuxt UI locale is imported. The site has one
//    language, and Docus's `import * as` put all of them — 129 KiB — in the
//    entry chunk of every page (error.vue carries the same change). It
//    comes through `#ui`: under pnpm's isolated layout `@nuxt/ui` is
//    Docus's dependency, out of the site's own reach.
// 2. The assistant panel mounts the first time it opens instead of right
//    after hydration, so its chat stack (the AI SDK, zod, a Markdown
//    parser, Shiki — about 700 KiB) loads only for someone who asks. A
//    question asked before it exists — the floating input opens it with
//    one — is handed over again once it has mounted: the panel only sends
//    on a change it sees. Its ⌘I shortcut is stood in for until then.
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'
import en from '#ui/locale/en'

const nuxtUiLocales = { en }

const appConfig = useAppConfig()
const { seo } = appConfig
useDocusShortcuts()
const site = useSiteConfig()
const { locale, locales, isEnabled, switchLocalePath } = useDocusI18n()
const { isEnabled: isAssistantEnabled, isOpen: isAssistantOpen, messages: assistantMessages, open: openAssistant } = useAssistant()

const assistantWanted = ref(false)
watch(isAssistantOpen, (open) => {
  if (open) assistantWanted.value = true
})
// Only a question asked on this page view is handed over — not one left
// stored by a request that failed earlier, which Docus's panel, mounted at
// hydration, never re-sent either.
let askedBeforeMount = false
watch(assistantMessages, (list) => {
  askedBeforeMount = list.at(-1)?.role === 'user'
})
function askPending() {
  if (askedBeforeMount) assistantMessages.value = [...assistantMessages.value]
}
// ⌘I is the panel's own shortcut, registered inside it — so until it is
// wanted, this one opens it (through Docus's open(), which stands down
// while Nuxt Studio's sidebar is expanded, as the panel's does). From then
// on the panel's handler toggles it and this one stands aside, so one
// press never toggles twice.
defineShortcuts({
  meta_i: {
    usingInput: true,
    handler: () => {
      if (isAssistantEnabled.value && !assistantWanted.value) openAssistant()
    },
  },
})

const nuxtUiLocale = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] || nuxtUiLocales.en)
const lang = computed(() => nuxtUiLocale.value.code)
const dir = computed(() => nuxtUiLocale.value.dir)
const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang,
    dir,
  },
})

useSeoMeta({
  title: seo.title,
  description: seo.description,
  ogSiteName: site.name,
  twitterCard: 'summary_large_image',
})

if (isEnabled.value) {
  const route = useRoute()
  const defaultLocale = useRuntimeConfig().public.i18n.defaultLocale!
  onMounted(() => {
    const currentLocale = route.path.split('/')[1]
    if (!locales.some(locale => locale.code === currentLocale)) {
      return navigateTo(switchLocalePath(defaultLocale) as string)
    }
  })
}

const { data: navigation } = await useAsyncData(() => `navigation_${collectionName.value}`, () => queryCollectionNavigation(collectionName.value as keyof PageCollections), {
  transform: (data: ContentNavigationItem[]) => transformNavigation(data, isEnabled.value, locale.value),
  watch: [locale],
})

provide('navigation', navigation)

const { subNavigationMode } = useSubNavigation(navigation)
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div class="flex">
      <div
        class="flex-1 min-w-0"
        :class="{ 'docus-sub-header': subNavigationMode === 'header' }"
      >
        <AppHeader v-if="$route.meta.header !== false" />
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <AppFooter v-if="$route.meta.footer !== false" />

        <ClientOnly>
          <AppSearch :navigation="navigation" />
          <LazyAssistantFloatingInput v-if="isAssistantEnabled" />
        </ClientOnly>
      </div>

      <ClientOnly v-if="isAssistantEnabled && assistantWanted">
        <LazyAssistantPanel @vue:mounted="askPending" />
      </ClientOnly>
    </div>
  </UApp>
</template>

<style>
@media (min-width: 1024px) {
  .docus-sub-header {
    /* 64px base header + 48px sub-navigation bar */
    --ui-header-height: 112px;
  }
}
</style>
