<script setup lang="ts">
// Overrides Docus's AppSearch with `color-mode` off: the ⌘K palette
// otherwise carries a System / Light / Dark group, and the scheme here is
// the OS's, with no toggle anywhere on the page. Search itself is Docus's:
// copied verbatim from docus@5.13.0 app/components/app/AppSearch.vue with
// only that prop changed; re-diff on a Docus bump.
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'

const props = defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const appConfig = useAppConfig()
const { locale, isEnabled } = useDocusI18n()

const collectionName = computed(() => (isEnabled.value ? `docs_${locale.value}` : 'docs') as keyof PageCollections)
const useFts = appConfig.search.fts

const { data: files } = useFts
  ? { data: ref(null) }
  : useLazyAsyncData(`search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value), {
      server: false,
      watch: [locale],
    })

const { search, status: searchStatus, init } = useFts
  ? useSearchCollection(collectionName, { immediate: false, ignoredTags: ['style'] })
  : { search: undefined, status: ref(undefined), init: () => {} }

if (useFts) {
  const { open } = useContentSearch()
  watch(open, (value) => {
    if (value && searchStatus.value === 'idle') {
      init()
    }
  })
}

const links = computed(() => useFts
  ? props.navigation?.filter(item => item.children?.length).map(item => ({
      label: item.title,
      icon: item.icon,
      to: item.children![0]!.path,
    }))
  : undefined,
)
</script>

<template>
  <LazyUContentSearch
    :files="files"
    :search="search"
    :search-status="searchStatus"
    :links="links"
    :navigation="navigation"
    :color-mode="false"
  />
</template>
