<script setup lang="ts">
// Overrides Nuxt UI's ProseA (dist/runtime/components/prose/A.vue, 4.11.0):
// an absolute `href` opens in a new tab and carries a small arrow after the
// text, so a link that leaves the site reads differently from one that
// doesn't. Internal links are untouched. Re-diff on a Nuxt UI bump.
import { normalizeClass } from 'vue'
import theme from '#build/ui/prose/a'
import { tv } from '#ui/utils/tv'

const props = defineProps<{
  href?: string
  target?: string
  class?: string | string[] | Record<string, boolean>
  ui?: { base?: string }
}>()

const appConfig = useAppConfig()
// A scheme or a scheme-relative `//host` — the same test ULink applies.
const external = computed(() => !!props.href && /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(props.href))
// Merged with tailwind-merge, as upstream does, so app.config can replace a
// theme class rather than race it. `class` may come in Vue's object form,
// which tailwind-merge does not read — normalized to a string first.
const classes = computed(() => tv({ extend: theme, ...appConfig.ui?.prose?.a || {} })({ class: [props.ui?.base, normalizeClass(props.class)] }))
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
      class="ms-px inline-block size-[0.72em] align-[0.2em] opacity-70 transition-transform duration-300 [a:hover>&]:translate-x-px [a:hover>&]:-translate-y-px"
      aria-hidden="true"
    />
  </ULink>
</template>
