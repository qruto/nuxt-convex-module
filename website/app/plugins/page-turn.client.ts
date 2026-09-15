// The direction of a page turn, and the one page that does not get one.
// Nuxt starts a view transition on every page change (nuxt.config
// `experimental.viewTransition`) and hands it to the hook below before
// the browser has drawn a frame; the stylesheet (css/chrome.css, THE
// PAGE TURN) does the rest.
//
// Leaving the landing gets no transition. The browser paints the old
// page into a snapshot before the route changes, and the landing's
// paint — the hero marks' filter chains above all — costs the main
// thread 2–5s on a 1440px viewport (measured 2026-09-16; every other
// page is under 20ms). Chrome gives the update four seconds, then
// abandons the transition anyway, so the page would freeze and then
// cut. Skipping the transition once started is not enough: the raster
// is already paid by then (~1s, measured). So it is never started:
// Nuxt reads the switch off the target route's meta — the same key
// definePageMeta sets, on the object vue-router builds fresh for this
// one navigation — and the guard below turns it off whenever the page
// being left is the landing. Arriving on the landing is fine: the new
// page is drawn live, not snapshotted, so a docs page still turns into
// it.
//
// The rest is the direction: `back` when the navigation came out of the
// history, the browser's back button (a swipe carries its own animation,
// and Nuxt skips the transition for it), `forward` for everything else.
// The history listener is the one place the direction is known:
// vue-router reads it off the popstate state and tells listeners before
// any route guard runs.
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  router.beforeEach((to, from) => {
    if (from.name === 'index') to.meta.viewTransition = false
  })

  let direction: 'forward' | 'back' = 'forward'
  router.options.history.listen((_to, _from, info) => {
    direction = info.direction === 'back' ? 'back' : 'forward'
  })
  nuxtApp.hook('page:view-transition:start', (transition) => {
    transition.types.add(direction)
  })
  // A hash jump out of the history fires the listener too, with no page
  // change behind it; the direction it left must not colour the next
  // click.
  router.afterEach(() => {
    direction = 'forward'
  })
})
