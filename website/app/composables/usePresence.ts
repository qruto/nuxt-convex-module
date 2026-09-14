import { api } from '#convex/api'

// "N people here" — a heartbeat to the presence table while this tab is
// visible, and the live count read back over the same socket. The count is
// a real query result; the heartbeat is what puts this tab in it. The beat
// is well inside the server's window, and the tab leaves on pagehide so a
// closed window is gone from the count at once.
const BEAT_MS = 10_000

export function usePresence(sid: Ref<string>) {
  const client = useConvex()
  const count = client ? useQuery(api.presence.count, {}) : shallowRef<number | undefined>(undefined)
  const beat = client ? useMutation(api.presence.heartbeat) : undefined
  const leave = client ? useMutation(api.presence.leave) : undefined

  let timer: ReturnType<typeof setInterval> | undefined
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
  onMounted(() => {
    const onVisibility = () => (document.hidden ? stop() : start())
    const onHide = () => {
      stop()
      if (leave && sid.value) leave({ sid: sid.value }).catch(() => {})
    }
    // A page restored from the back-forward cache comes back through
    // pageshow, not mount; it rejoins there.
    const onShow = () => !document.hidden && start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onShow)
    onUnmounted(() => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('pageshow', onShow)
    })
    // The sid lands after mount (useVisitor); wait for it.
    watch(sid, value => value && start(), { immediate: true })
  })
  onUnmounted(stop)

  return { count }
}
