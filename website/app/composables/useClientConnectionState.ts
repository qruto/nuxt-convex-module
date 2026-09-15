import type { ConnectionState } from 'convex/browser'
import type { ShallowRef } from 'vue'

// THE SOCKET IS A BROWSER FACT. `useConvexConnectionState` reads the client's
// connection state synchronously in setup — the same read upstream's hook
// makes during render — and that read instantiates the sync client, which
// opens its WebSocket on construction. Node 22+ ships a global `WebSocket`,
// so on the server that is a real connection: every prerendered route that
// rendered a connection lamp left one open, and `nuxt build` — the process
// that prerenders — never exited (12 sockets to the deployment after "Build
// complete!", on Vercel until the build timed out). The state is only
// meaningful after mount anyway; during SSR and hydration the socket is
// simply not open yet. So the server reads nothing, and the browser reads
// what upstream reads.
export function useClientConnectionState(): ShallowRef<ConnectionState | undefined> {
  if (import.meta.server) return shallowRef<ConnectionState | undefined>(undefined)
  return useConvexConnectionState()
}
