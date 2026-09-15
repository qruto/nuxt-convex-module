// THE PLATES SETTLE BY SCRIPT (2026-09-14). landing.css declares native
// `scroll-snap-type: y proximity`, and that is what a reader without
// script gets. The native settle is the browser's own: it has no curve
// the page can name and it lands hard — a plate arrives like a slide
// change. With script the page takes the settle over, under the same
// rule (a scroll that ends near a plate's head settles on it, one that
// ends mid-plate stays put), but eased over a duration that grows with
// the distance, so a plate glides in instead of cutting in.
//
// `scrollend` is the whole trigger: it fires once the reader's scroll —
// wheel momentum included — has come to rest, which is exactly the
// moment native snapping acts. Any input during the glide cancels it;
// the reader is always in charge. Reduced motion leaves the scroll
// alone entirely, for the reason landing.css gives.

// The reach, as a share of the frame: a scroll that ends further than
// this from every snap position stays where it is. Chromium's own
// `proximity` threshold is a third of the snapport.
const REACH = 1 / 3

// The glide: a floor so a short hop still reads as a move, plus a share
// of the distance, capped so the far end of the reach never drags.
const glide = (distance: number) => Math.min(1100, 480 + distance * 0.6)
// A rounder curve than the quartic: it leaves the start gently rather
// than kicking off, and spends longer on the landing.
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function useLandingSnap() {
  onMounted(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const html = document.documentElement
    html.classList.add('landing-snap-driven')
    let frame = 0

    // Every plate's head, and the foot of the page (the footer's end),
    // as document offsets — read fresh at every settle, since the live
    // plates change height. A plate's snap position is its head less
    // its `scroll-margin-top`, the way native snapping reads it: the
    // hero's margin hands the rail's band back (landing.css), and
    // without it the page would open 4rem down.
    const px = (length: string) => Number.parseFloat(length) || 0 // `auto` → 0
    const positions = () => {
      const heads = [...document.querySelectorAll<HTMLElement>('.landing-panel')]
        .map(plate => plate.getBoundingClientRect().top + scrollY
          - px(getComputedStyle(plate).scrollMarginTop)
          - px(getComputedStyle(html).scrollPaddingTop))
      const footer = document.querySelector('footer')
      if (footer) heads.push(footer.getBoundingClientRect().bottom + scrollY - innerHeight)
      const floor = html.scrollHeight - innerHeight
      return heads.map(y => Math.min(Math.max(0, y), floor))
    }

    const cancel = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    const settle = () => {
      // Our own glide scrolls once a frame, and a browser may call each
      // pause between frames a scroll's end.
      if (frame) return
      const from = scrollY
      let to = from
      let nearest = Infinity
      for (const y of positions()) {
        const distance = Math.abs(y - from)
        if (distance < nearest) [to, nearest] = [y, distance]
      }
      // Already there (the settle after our own glide lands here too),
      // or out of reach.
      if (nearest < 1 || nearest > innerHeight * REACH) return
      const duration = glide(nearest)
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        scrollTo({ top: from + (to - from) * easeOut(t), behavior: 'instant' })
        frame = t < 1 ? requestAnimationFrame(step) : 0
      }
      frame = requestAnimationFrame(step)
    }

    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    addEventListener('scrollend', settle)
    for (const type of inputs) addEventListener(type, cancel, { passive: true })
    onBeforeUnmount(() => {
      cancel()
      removeEventListener('scrollend', settle)
      for (const type of inputs) removeEventListener(type, cancel)
      html.classList.remove('landing-snap-driven')
    })
  })
}
