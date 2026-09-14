import { api } from '#convex/api'

// "N people here" — a heartbeat to the presence table while this tab is
// visible, and the live count read back over the same socket. The count is
// a real query result; the heartbeat is what puts this tab in it. The beat
// is well inside the server's window, and the tab leaves on pagehide so a
// closed window is gone from the count at once.
//
// One heartbeat per window, however many plates ask: the canvas and the
// console both call this on the landing page, and the second caller only
// reads the count. The beat starts with the first mounted caller and stops
// (leaving the table) with the last one, so a client-side navigation away
// drops the row too, not only a closed window.
const BEAT_MS = 10_000

let callers = 0
let timer: ReturnType<typeof setInterval> | undefined
let stopListening: (() => void) | undefined

export function usePresence(sid: Ref<string>) {
  const client = useConvex()
  const count = client ? useQuery(api.presence.count, {}) : shallowRef<number | undefined>(undefined)
  const beat = client ? useMutation(api.presence.heartbeat) : undefined
  const leave = client ? useMutation(api.presence.leave) : undefined

  function pulse() {
    if (!beat || !sid.value || document.hidden) return
    beat({ sid: sid.value }).catch(() => {})
  }
  function start() {
    stop()
    pulse()
    timer = setInterval(pulse, BEAT_MS)
  }
  function stop() {
    if (timer) clearInterval(timer)
    timer = undefined
  }
  function depart() {
    stop()
    if (leave && sid.value) leave({ sid: sid.value }).catch(() => {})
  }

  onMounted(() => {
    if (callers++ > 0) return
    const onVisibility = () => (document.hidden ? stop() : start())
    // A page restored from the back-forward cache comes back through
    // pageshow, not mount; it rejoins there.
    const onShow = () => !document.hidden && start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', depart)
    window.addEventListener('pageshow', onShow)
    // The sid lands after mount (useVisitor); wait for it.
    const unwatch = watch(sid, value => value && start(), { immediate: true })
    stopListening = () => {
      unwatch()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', depart)
      window.removeEventListener('pageshow', onShow)
      depart()
    }
  })
  onUnmounted(() => {
    if (--callers > 0) return
    stopListening?.()
    stopListening = undefined
  })

  return { count }
}
