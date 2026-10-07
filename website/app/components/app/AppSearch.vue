<script setup lang="ts">
// Overrides Docus's AppSearch with `color-mode` off: the ⌘K palette
// otherwise carries a System / Light / Dark group, and the scheme here is
// the OS's, with no toggle anywhere on the page. Search itself is Docus's:
// copied verbatim from docus@5.13.0 app/components/app/AppSearch.vue with
// that prop changed, the keycap footer added and the sections loaded on
// the palette's first open (below); re-diff on a Docus bump.
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'

const props = defineProps<{
  navigation?: ContentNavigationItem[]
}>()

const appConfig = useAppConfig()
const { locale, isEnabled } = useDocusI18n()

const collectionName = computed(() => (isEnabled.value ? `docs_${locale.value}` : 'docs') as keyof PageCollections)
const useFts = appConfig.search.fts

// The sections load when the palette first opens, as the FTS index below
// already does. Docus fetches them at hydration, and the query runs on
// Nuxt Content's in-browser SQLite — so every page view, searched or not,
// downloaded its 400 KiB WASM build and the database dump during load
// (Lighthouse, 2026-10-05).
const { open } = useContentSearch()

const { data: files, execute: loadFiles } = useFts
  ? { data: ref(null), execute: () => {} }
  : useLazyAsyncData(`search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value), {
      server: false,
      immediate: false,
      watch: [locale],
    })

const { search, status: searchStatus, init } = useFts
  ? useSearchCollection(collectionName, { immediate: false, ignoredTags: ['style'] })
  : { search: undefined, status: ref(undefined), init: () => {} }

watch(open, (value) => {
  if (!value) return
  if (useFts && searchStatus.value === 'idle') init()
  if (!useFts && !files.value) loadFiles()
})

const links = computed(() => useFts
  ? props.navigation?.filter(item => item.children?.length).map(item => ({
      label: item.title,
      icon: item.icon,
      to: item.children![0]!.path,
    }))
  : undefined,
)

const hints = [
  { keys: ['↑', '↓'], label: 'navigate' },
  { keys: ['↵'], label: 'open' },
  { keys: ['esc'], label: 'close' },
]
</script>

<template>
  <LazyUContentSearch
    :files="files"
    :search="search"
    :search-status="searchStatus"
    :links="links"
    :navigation="navigation"
    :color-mode="false"
  >
    <template #footer>
      <div class="flex items-center gap-4 text-xs text-muted">
        <span v-for="hint in hints" :key="hint.label" class="flex items-center gap-1.5 last:ms-auto">
          <kbd v-for="key in hint.keys" :key="key" class="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-(--radius-chip) convex-0 font-sans text-[11px] text-toned">{{ key }}</kbd>
          {{ hint.label }}
        </span>
      </div>
    </template>
  </LazyUContentSearch>
</template>
