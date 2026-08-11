import type { ComputedRef, Ref } from 'vue'

/**
 * The landing page's replay engine. A "script" is one pass of a recorded
 * demonstration — a plain async function driving component refs through the
 * `wait`/`type` tools it receives. The engine owns everything around it:
 * viewport gating, pause/resume, reduced-motion, and the takeover contract
 * (any real interaction inside `root` stops the recording for good; the
 * component's own controls keep working because they mutate the same refs).
 *
 * Client-only by construction: nothing arms before `onMounted`, so SSR
 * renders the component's initial markup and hydration can't mismatch.
 */

export interface DemoTools {
  /** Cancellation- and pause-aware sleep. */
  wait: (ms: number) => Promise<void>
  /** Growing-prefix typing effect into `apply` (default ~18 chars/second). */
  type: (text: string, apply: (partial: string) => void, opts?: { cps?: number }) => Promise<void>
}

export type DemoState = 'idle' | 'playing' | 'paused' | 'stopped' | 'done'

export interface DemoScriptOptions {
  /** false = one pass (default), true = forever, n = n passes. */
  loop?: boolean | number
  /** Delay between passes, ms. */
  loopDelay?: number
  /** Offset before the first pass so neighbouring demos don't pulse in lockstep. */
  initialDelay?: number
  /** Start on first viewport entry (default true). */
  autoStart?: boolean
  /**
   * Reduced-motion fallback: set the finished readout synchronously.
   * The script itself never runs under `prefers-reduced-motion: reduce`.
   */
  reducedMotion?: () => void
}

/** Private sentinel: a cancelled pass unwinds through this, never through user code errors. */
class DemoCancelled extends Error {}

export function useDemoScript(
  root: Ref<HTMLElement | null> | ComputedRef<HTMLElement | null>,
  script: (t: DemoTools) => Promise<void>,
  options: DemoScriptOptions = {},
) {
  const { loop = false, loopDelay = 2400, initialDelay = 0, autoStart = true } = options

  const state = ref<DemoState>('idle')

  // Bumping the generation invalidates every timer the previous pass parked
  // on — a stale setTimeout resolves, sees the stale generation, and unwinds
  // through DemoCancelled instead of mutating anything.
  let generation = 0
  let resumeGate: (() => void) | null = null
  let observer: IntersectionObserver | null = null
  let inViewport = false
  let cleanups: Array<() => void> = []

  function wait(gen: number, ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (gen !== generation) return reject(new DemoCancelled())
        if (state.value !== 'paused') return resolve()
        // Park on the resume gate; liveness is re-checked on release so a
        // stop() while parked rejects instead of leaving the pass hanging.
        resumeGate = () => {
          if (gen !== generation) reject(new DemoCancelled())
          else resolve()
        }
      }, ms)
    })
  }

  async function type(gen: number, text: string, apply: (partial: string) => void, opts?: { cps?: number }) {
    const interval = 1000 / (opts?.cps ?? 18)
    for (let i = 1; i <= text.length; i++) {
      await wait(gen, interval)
      apply(text.slice(0, i))
    }
  }

  function toolsFor(gen: number): DemoTools {
    return {
      wait: ms => wait(gen, ms),
      type: (text, apply, opts) => type(gen, text, apply, opts),
    }
  }

  function releaseGate() {
    const gate = resumeGate
    resumeGate = null
    gate?.()
  }

  async function run(passes: number, withInitialDelay: boolean) {
    const gen = ++generation
    state.value = 'playing'
    const tools = toolsFor(gen)
    try {
      if (withInitialDelay && initialDelay > 0) await tools.wait(initialDelay)
      for (let pass = 0; pass < passes; pass++) {
        if (pass > 0) await tools.wait(loopDelay)
        await script(tools)
      }
      state.value = 'done'
    }
    catch (e) {
      if (!(e instanceof DemoCancelled)) throw e
    }
  }

  function play() {
    if (state.value !== 'idle') return
    const passes = loop === true ? Infinity : loop === false ? 1 : loop
    void run(passes, true)
  }

  function pause() {
    if (state.value === 'playing') state.value = 'paused'
  }

  function resume() {
    if (state.value !== 'paused') return
    state.value = 'playing'
    releaseGate()
  }

  /** Permanent: the visitor took over. Manual controls keep working — they own the refs. */
  function stop() {
    if (state.value === 'stopped') return
    generation++
    state.value = 'stopped'
    releaseGate()
  }

  /** Explicit user action: one more pass, even after stop(). */
  function replay() {
    generation++
    releaseGate()
    state.value = 'idle'
    void run(1, false).then(() => {
      // One pass only, regardless of loop config — back to stopped, not looping.
      if (state.value === 'done') state.value = 'stopped'
    })
  }

  onMounted(() => {
    const el = root.value
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      options.reducedMotion?.()
      state.value = 'stopped'
      return
    }

    // The takeover contract: a real pointer, key, or focus inside the demo
    // means the visitor is driving now. Capture phase so it beats component
    // handlers; scripted typing mutates refs without events, so the script
    // can't cancel itself.
    const takeover = () => stop()
    for (const event of ['pointerdown', 'keydown', 'focusin'] as const) {
      el.addEventListener(event, takeover, { capture: true })
      cleanups.push(() => el.removeEventListener(event, takeover, { capture: true }))
    }

    const onVisibility = () => {
      if (document.hidden) pause()
      else if (inViewport) resume()
    }
    document.addEventListener('visibilitychange', onVisibility)
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inViewport = entry.isIntersecting
          if (entry.isIntersecting) {
            if (state.value === 'idle' && autoStart) play()
            else resume()
          }
          else {
            pause()
          }
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
  })

  onUnmounted(() => {
    generation++
    releaseGate()
    observer?.disconnect()
    observer = null
    for (const cleanup of cleanups) cleanup()
    cleanups = []
  })

  return { state: readonly(state), play, pause, resume, stop, replay }
}
