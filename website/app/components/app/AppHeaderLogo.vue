<script setup lang="ts">
// Overrides Docus's AppHeaderLogo to draw the mark as one plain, sized <img>
// when both schemes use the same file, as this site's does. Docus renders it
// through UColorModeImage, which with @nuxt/image sends an SVG through the
// image optimizer (`/_vercel/image?url=/logo.svg&w=1536` — a vector gains
// nothing there), twice (one copy per scheme), with no width or height and
// an inline `onerror` the CSP refuses. The right-click brand menu is Docus's,
// unchanged. Copied from docus@5.13.0 app/components/app/AppHeaderLogo.vue;
// re-diff on a Docus bump. The size is public/logo.svg's own, for the aspect
// ratio the page reserves before the file arrives — keep it in step. The
// two-file branch is Lazy-, so its component loads only where it is used.
const appConfig = useAppConfig()
const { hasLogo, headerLightUrl, headerDarkUrl, contextMenuItems } = useLogoAssets()
</script>

<template>
  <UContextMenu
    v-if="hasLogo"
    :items="contextMenuItems"
  >
    <img
      v-if="headerLightUrl === headerDarkUrl"
      :src="headerLightUrl"
      :alt="appConfig.header?.logo?.alt || appConfig.header?.title"
      width="283"
      height="235"
      :class="['h-6 w-auto shrink-0', appConfig.header?.logo?.class]"
    >
    <LazyUColorModeImage
      v-else
      :light="headerLightUrl"
      :dark="headerDarkUrl"
      :alt="appConfig.header?.logo?.alt || appConfig.header?.title"
      :class="['h-6 w-auto shrink-0', appConfig.header?.logo?.class]"
    />
  </UContextMenu>
  <span v-else>
    {{ appConfig.header?.title || '{appConfig.header.title}' }}
  </span>
</template>
