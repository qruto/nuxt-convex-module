<script setup lang="ts">
// The package-manager picker: the label and the chooser. Mounted at the top
// of the docs sidebar (DocsAsideLeftTop) and, below `lg` where the sidebar is
// hidden, at the top of the header's mobile menu (AppHeader's body slot) —
// one component, so the two cannot drift apart.
const { pm, set } = usePackageManager()
const items = PACKAGE_MANAGERS.map(name => ({ label: name, value: name, icon: `i-vscode-icons-file-type-${name}` }))
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
      :icon="`i-vscode-icons-file-type-${pm}`"
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
    />
  </div>
</template>
