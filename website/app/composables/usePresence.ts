import { api } from '#convex/api'

// "N people here" — a heartbeat to the presence table while this tab is
// visible, and the live count read back over the same socket. The count is
// a real query result; the heartbeat is what puts this tab in it.
const BEAT_MS = 20_000

export function usePresence(sid: Ref<string>) {
  const client = useConvex()
  const count = client ? useQuery(api.presence.count, {}) : shallowRef<number | undefined>(undefined)
  const beat = client ? useMutation(api.presence.heartbeat) : undefined

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
    document.addEventListener('visibilitychange', onVisibility)
    onUnmounted(() => document.removeEventListener('visibilitychange', onVisibility))
    // The sid lands after mount (useVisitor); wait for it.
    watch(sid, value => value && start(), { immediate: true })
  })
  onUnmounted(stop)

  return { count }
}
