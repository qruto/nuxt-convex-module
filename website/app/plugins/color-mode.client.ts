// The scheme is the operating system's. There is no toggle on the page
// (AppHeader / AppFooterRight / AppSearch overrides) and no `d` shortcut
// (app.config `docus.shortcuts`), but @nuxtjs/color-mode still honours a
// preference a visitor stored back when the toggle existed — clear it, so
// every visit follows `prefers-color-scheme`.
//
// This has to happen in `app:mounted`, not at plugin time: the module's own
// client plugin hydrates the state as `unknown` and, in ITS `app:mounted`
// hook, copies the stored preference back over whatever was set before.
// Module plugins register first, so their hook runs first and this one
// gets the last word — after a tick. Their hook writes the stored value
// in the same synchronous run; setting `system` straight back would leave
// the module's `preference` watcher seeing system → system and never
// re-deriving `value` from the media query (the page stays dark with
// `system` in storage). A tick later the watcher sees a real change.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', async () => {
    await nextTick()
    const colorMode = useColorMode()
    if (colorMode.preference !== 'system') colorMode.preference = 'system'
  })
})
