<script setup lang="ts">
import type { PackageManager } from '#shared/package-managers'
import { PACKAGE_MANAGERS } from '#shared/package-managers'

// The package-manager picker: the label and the chooser. Mounted at the top
// of the docs sidebar (DocsAsideLeftTop) and, below `lg` where the sidebar is
// hidden, at the top of the header's mobile menu (AppHeader's body slot) —
// one component, so the two cannot drift apart.
const { pm, set } = usePackageManager()
const items = PACKAGE_MANAGERS.map(name => ({ label: name, value: name }))

// The marks are written out in full, never assembled from the name: the icon
// module bundles the names its scan finds in the source, and a name built at
// runtime was never bundled — npm, yarn and bun went blank in the menu on the
// deployed site, whose CSP blocks the Iconify API the client falls back to.
// vscode-icons draws pnpm's lower blocks white, and on the light pocket they
// vanished; its light variant draws them grey. npm, yarn and bun read on both
// grounds. Both marks are rendered and the colour-mode class picks one, so
// the server's markup is right whichever scheme the visitor's OS is in.
const MARKS: Record<PackageManager, { dark: string, light: string }> = {
  pnpm: { dark: 'i-vscode-icons-file-type-pnpm', light: 'i-vscode-icons-file-type-light-pnpm' },
  npm: { dark: 'i-vscode-icons-file-type-npm', light: 'i-vscode-icons-file-type-npm' },
  yarn: { dark: 'i-vscode-icons-file-type-yarn', light: 'i-vscode-icons-file-type-yarn' },
  bun: { dark: 'i-vscode-icons-file-type-bun', light: 'i-vscode-icons-file-type-bun' },
}
const darkIcon = (name: PackageManager) => MARKS[name].dark
const lightIcon = (name: PackageManager) => MARKS[name].light
</script>

<template>
  <div>
    <p class="mb-2 font-mono text-xs font-semibold tracking-[0.06em] text-toned convex-stamp">
      preferred package manager
    </p>
    <!-- The chooser is a pocket cut into the sidebar's own ground (the
         page dish, not a plate's well — a well put a lighter tile on the
         page). The name is scribed into its floor; the logo sits in a
         round seat bored a step deeper into that floor, and the chevron
         is a raised part in its own scribed cell that turns over when
         the menu is out. The seat and the cell, the menu — a plate
         pulled out from under the pocket — and the pocket that slides
         between its rows are THE PACKAGE CHOOSER in chrome.css, hung on
         these hooks; the menu renders in a portal, so a scoped style
         could not reach it. Full width: it is a row of the sidebar,
         flush with the label above it and the tree below, not a control
         floating at the start of one. The leading slot is the seat's
         own box — six pixels in, 24 wide, the logo centred in it — so
         the two cannot drift apart. The label above is the raised mono
         marking (convex-stamp): milled, with walls, where the shallow
         rung read flat at 12px. -->
    <USelect
      :model-value="pm"
      :items="items"
      :icon="darkIcon(pm)"
      color="neutral"
      variant="soft"
      size="sm"
      class="package-chooser w-full font-mono concave-ground hover:text-highlighted transition-colors"
      :ui="{
        leading: 'ps-0 start-1.5 w-6 justify-center',
        value: 'concave-text',
        trailing: 'pe-2',
        trailingIcon: 'convex-icon transition-transform duration-200 ease-out motion-reduce:transition-none group-data-[state=open]:rotate-180',
        content: 'package-menu',
        viewport: 'package-menu-list',
        item: 'font-mono',
      }"
      aria-label="preferred package manager"
      @update:model-value="set($event as PackageManager)"
    >
      <template #leading="{ ui }">
        <span class="contents dark:hidden"><UIcon :name="lightIcon(pm)" :class="ui.leadingIcon()" /></span>
        <span class="hidden dark:contents"><UIcon :name="darkIcon(pm)" :class="ui.leadingIcon()" /></span>
      </template>
      <template #item-leading="{ item, ui }">
        <span class="contents dark:hidden"><UIcon :name="lightIcon(item.value)" :class="ui.itemLeadingIcon()" /></span>
        <span class="hidden dark:contents"><UIcon :name="darkIcon(item.value)" :class="ui.itemLeadingIcon()" /></span>
      </template>
    </USelect>
  </div>
</template>
