<script setup lang="ts">
// Overrides Docus's DocsPageHeaderLinks to name the menu key: Docus renders
// it as a bare chevron, which a screen reader announces as "button" with no
// name. Everything else is Docus's markup, copied from docus@5.13.0
// app/components/docs/DocsPageHeaderLinks.vue; re-diff on a Docus bump.
// Its two imports could not come with it — @vueuse/core and ufo are Docus's
// dependencies, out of reach under pnpm's isolated layout — so the clipboard
// and the URL joins are written out below, behaving as theirs do.
const route = useRoute()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const appBaseURL = runtimeConfig.app?.baseURL || '/'
const mcpRoute = (runtimeConfig.public.mcp as { route?: string } | undefined)?.route || '/mcp'

const { t } = useDocusI18n()

// useClipboard's contract: nothing without the Clipboard API, and `copied`
// holds for 1.5s after a copy.
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
async function copy(text: string) {
  if (!navigator.clipboard) return
  await navigator.clipboard.writeText(text)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1500)
}

// ufo's joinURL and withTrailingSlash, for the two shapes used here.
const withTrailingSlash = (url: string) => url.endsWith('/') ? url : `${url}/`
const joinURL = (base: string, ...parts: string[]) =>
  [base.replace(/\/+$/, ''), ...parts.map(part => part.replace(/^\/+|\/+$/g, ''))].join('/')

const markdownLink = computed(() => `${window?.location?.origin}${withTrailingSlash(appBaseURL)}raw${route.path}.md`)
const mcpServerUrl = computed(() => `${window?.location?.origin}${joinURL(appBaseURL, mcpRoute)}`)
const mcpDeeplink = computed(() => `${window?.location?.origin}${joinURL(appBaseURL, mcpRoute, 'deeplink')}`)
const items = computed(() => [
  [{
    label: t('docs.copy.link'),
    icon: 'i-lucide-link',
    onSelect() {
      copy(markdownLink.value)
    },
  },
  {
    label: t('docs.copy.view'),
    icon: 'i-simple-icons:markdown',
    target: '_blank',
    to: markdownLink.value,
  },
  {
    label: t('docs.copy.gpt'),
    icon: 'i-simple-icons:openai',
    target: '_blank',
    to: `https://chatgpt.com/?hints=search&q=${encodeURIComponent(`Read ${markdownLink.value} so I can ask questions about it.`)}`,
  },
  {
    label: t('docs.copy.claude'),
    icon: 'i-simple-icons:anthropic',
    target: '_blank',
    to: `https://claude.ai/new?q=${encodeURIComponent(`Read ${markdownLink.value} so I can ask questions about it.`)}`,
  }],
  [
    {
      label: 'Copy MCP Server URL',
      icon: 'i-lucide-link',
      onSelect() {
        copy(mcpServerUrl.value)
        toast.add({
          title: 'Copied to clipboard',
          icon: 'i-lucide-check-circle',
        })
      },
    },
    {
      label: 'Add MCP Server',
      icon: 'i-simple-icons:cursor',
      target: '_blank',
      to: mcpDeeplink.value,
    },
  ],
])

async function copyPage() {
  const page = await $fetch<string>(`/raw${route.path}.md`)
  copy(page)
}
</script>

<template>
  <UFieldGroup size="sm">
    <UButton
      :label="t('docs.copy.page')"
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      color="neutral"
      variant="soft"
      :ui="{
        leadingIcon: 'text-neutral size-3.5',
      }"
      @click="copyPage"
    />

    <UDropdownMenu
      size="sm"
      :items="items"
      :content="{
        align: 'end',
        side: 'bottom',
        sideOffset: 8,
      }"
    >
      <UButton
        icon="i-lucide-chevron-down"
        color="neutral"
        variant="soft"
        class="border-l border-muted"
        aria-label="More page actions"
      />
    </UDropdownMenu>
  </UFieldGroup>
</template>
