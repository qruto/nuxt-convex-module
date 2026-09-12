// Whether a live plate can honestly say "live": a client exists, the query
// has not errored, and the socket is not known to be down. The socket's
// state is only consulted AFTER mount — during SSR and hydration it is
// simply not open yet, and a plate that hydrates as "offline" for the
// hundred milliseconds before the socket connects mismatches the HTML the
// server sent (which said live) and flickers the lamp for nothing.
export function useDemoOnline(error: Ref<unknown> | ComputedRef<unknown>) {
  const client = useConvex()
  const connection = client ? useConvexConnectionState() : shallowRef()
  const mounted = ref(false)
  onMounted(() => {
    mounted.value = true
  })
  return computed(() =>
    !!client
    && !error.value
    && (!mounted.value || connection.value?.isWebSocketConnected !== false))
}
