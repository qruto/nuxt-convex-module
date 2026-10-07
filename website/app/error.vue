<script setup lang="ts">
// Overrides Docus's error.vue for the reason app.vue is overridden: only
// the English Nuxt UI locale is imported (through `#ui`, as there). This
// page is bundled into every page's entry chunk, so its `import * as` alone
// still put all the locales there. Copied from docus@5.13.0 app/error.vue
// (its helpers arrive through the layer's auto-imports); re-diff on a
// Docus bump.
// fallow-ignore-file code-duplication -- app.vue is the same Docus file's sibling, copied verbatim for the same reason; both stay diffable against Docus, not against each other
import type { NuxtError } from '#app'
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'
import en from '#ui/locale/en'

const nuxtUiLocales = { en }

const props = defineProps<{
  error: NuxtError
}>()

const { locale, locales, isEnabled, t, switchLocalePath } = useDocusI18n()

const nuxtUiLocale = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] || nuxtUiLocales.en)
const lang = computed(() => nuxtUiLocale.value.code)
const dir = computed(() => nuxtUiLocale.value.dir)

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
})

const localizedError = computed(() => {
  return {
    ...props.error,
    statusMessage: t('common.error.title'),
    message: t('common.error.description'),
  }
})

useSeoMeta({
  title: () => t('common.error.title'),
  description: () => t('common.error.description'),
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

const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')

const { data: navigation } = await useAsyncData(`navigation_${collectionName.value}`, () => queryCollectionNavigation(collectionName.value as keyof PageCollections), {
  transform: (data: ContentNavigationItem[]) => transformNavigation(data, isEnabled.value, locale.value),
  watch: [locale],
})

provide('navigation', navigation)
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <AppHeader />

    <UError :error="localizedError" />

    <AppFooter />

    <ClientOnly>
      <AppSearch :navigation="navigation" />
    </ClientOnly>
  </UApp>
</template>
