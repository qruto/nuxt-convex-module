<script setup lang="ts">
// Overrides Docus's DocsAsideRight to give the TOC a third state. The
// theme knows two: a column from `lg` up, a collapsible strip over the
// article below it. But between lg and xl the article has no room for a
// third column (see `ui.page` in app.config), so the page hides the
// right slot there and this file puts the TOC behind a pull tab on the
// right edge of the viewport instead — a slideover holding the same
// list, with the same Ecosystem links under it. The tab is teleported
// to <body> because the slot it belongs to is `display: none` in that
// band, and a fixed box inside a hidden one is not painted.
//
// Everything else is Docus's markup, copied verbatim from docus@5.13.0
// app/components/docs/DocsAsideRight.vue (its composables arrive through
// the layer's auto-imports); re-diff on a Docus bump.
import type { DocsCollectionItem } from '@nuxt/content'

const props = defineProps<{
  page?: DocsCollectionItem | null
}>()

const links = computed(() => props.page?.body?.toc?.links || [])

const { subNavigationMode } = useSubNavigation()
const appConfig = useAppConfig()
const { t } = useDocusI18n()

const contentTocVariants = useUIConfig('contentToc')

const title = computed(() => appConfig.toc?.title || t('docs.toc'))
const tabOpen = ref(false)
// A heading picked in the slideover closes it: the page is what the
// reader asked for, and the tab is still there for the next one.
const route = useRoute()
watch(() => route.hash, () => {
  tabOpen.value = false
})
// So does leaving the band: the tab's wrapper is hidden by CSS outside
// lg..xl, but the open drawer is portalled to the end of <body> and
// would stay up with no tab to close it. Same query as `lg:max-xl`.
onMounted(() => {
  const band = window.matchMedia('(width >= 64rem) and (width < 80rem)')
  const leaveBand = (event: MediaQueryListEvent) => {
    if (!event.matches) tabOpen.value = false
  }
  band.addEventListener('change', leaveBand)
  onBeforeUnmount(() => band.removeEventListener('change', leaveBand))
})
</script>

<template>
  <div>
    <UContentToc
      v-if="links.length"
      :highlight="contentTocVariants.highlight ?? true"
      :highlight-color="contentTocVariants.highlightColor"
      :highlight-variant="contentTocVariants.highlightVariant ?? 'circuit'"
      :color="contentTocVariants.color"
      :title="title"
      :links="links"
      :class="{ 'hidden lg:block': subNavigationMode }"
    >
      <template #bottom>
        <DocsAsideRightBottom />
      </template>
    </UContentToc>

    <Teleport to="body">
      <!-- The pull tab, fixed to the right edge in the band where the
           column is folded — 28px wide, so it sits inside the container's
           32px gutter and clears the article. The wrapper carries the
           position so the tab itself can keep the button's press (a
           half-pixel drop) and its own vertical writing mode, which would
           turn logical insets and corners on the button sideways. No
           z-index on purpose: the slideover's overlay and panel are
           portalled to the end of <body> with none either, and the only
           way to stay UNDER them once the tab has been pulled is to stack
           by document order. -->
      <div
        v-if="links.length"
        class="hidden lg:max-xl:block fixed end-0 top-1/2 -translate-y-1/2"
      >
        <!-- Kept mounted while closed: the list inside marks the heading
             in view from a hook that fires when the page has loaded, and
             a list first mounted on opening the drawer has missed it. -->
        <USlideover
          v-model:open="tabOpen"
          :title="title"
          side="right"
          :unmount-on-hide="false"
          :ui="{
            // `bg-transparent` drops the theme's opaque bg-default so the
            // sheet's own frosted fill (panel-matte, depth.css) is the one
            // that paints.
            content: 'bg-transparent panel-matte sm:ring-0 sm:shadow-(--elevation-3) divide-y-0',
            header: 'min-h-0 pt-6 pb-0',
            title: 'text-sm convex-text',
            body: 'sm:pt-3',
          }"
        >
          <UButton
            :label="title"
            icon="i-lucide-list-tree"
            color="neutral"
            variant="soft"
            size="sm"
            class="toc-tab gap-2.5 rounded-none rounded-l-(--radius-strip) font-mono text-xs font-semibold tracking-[0.06em]"
            :ui="{ leadingIcon: 'size-4' }"
          />

          <template #body>
            <UContentToc
              :highlight="contentTocVariants.highlight ?? true"
              :highlight-color="contentTocVariants.highlightColor"
              :highlight-variant="contentTocVariants.highlightVariant ?? 'circuit'"
              :color="contentTocVariants.color"
              :links="links"
              :ui="{
                root: 'static mx-0 px-0 sm:mx-0 sm:px-0 max-h-none overflow-visible',
                container: 'lg:my-0 lg:py-6',
                // The slideover's header carries the title; the dish's
                // own would repeat it. `sr-only` rather than `hidden`:
                // the component appends its own `lg:flex` after these.
                trigger: 'lg:sr-only',
              }"
            >
              <template #bottom>
                <DocsAsideRightBottom />
              </template>
            </UContentToc>
          </template>
        </USlideover>
      </div>
    </Teleport>

    <DocsAsideMobileBar :links="links" />
  </div>
</template>

<style scoped>
/* The label runs down the strip, the way a tab on a drawer reads.
   `writing-mode` turns the button's inline axis vertical, so its own
   flex row (icon, then label) stacks top-to-bottom with nothing else
   said; the icon is a masked span and stays upright. The padding is
   set here rather than with `px-* py-*`: those are padding-inline and
   padding-block, and under a vertical writing mode they swap axes. */
.toc-tab {
  writing-mode: vertical-rl;
  padding: 0.75rem 0.375rem;
}
</style>
