<script setup lang="ts">
// Overrides Nuxt UI's ProseA (dist/runtime/components/prose/A.vue, 4.11.0):
// an absolute `href` opens in a new tab and carries a small arrow after the
// text, so a link that leaves the site reads differently from one that
// doesn't. Internal links are untouched. Re-diff on a Nuxt UI bump.
import theme from '#build/ui/prose/a'

const props = defineProps<{
  href?: string
  target?: string
  class?: string | string[] | Record<string, boolean>
  ui?: { base?: string }
}>()

const appConfig = useAppConfig()
// A scheme or a scheme-relative `//host` — the same test ULink applies.
const external = computed(() => !!props.href && /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(props.href))
const classes = computed(() => [theme.base, appConfig.ui?.prose?.a?.base, props.ui?.base, props.class])
</script>

<template>
  <ULink
    :href="props.href"
    :target="props.target ?? (external ? '_blank' : undefined)"
    :class="classes"
    raw
  >
    <slot />
    <UIcon
      v-if="external"
      name="i-lucide-arrow-up-right"
      class="ms-px inline-block size-[0.72em] align-[0.2em] opacity-70"
      aria-hidden="true"
    />
  </ULink>
</template>
