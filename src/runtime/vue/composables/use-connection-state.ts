import type { ConnectionState } from 'convex/browser'
import type { ShallowRef } from 'vue'
import { useConvexOrThrow } from '../client'
import { useSubscription } from './use-subscription'

/**
 * Vue composable to get the current {@link ConnectionState} and subscribe to changes.
 *
 * This composable returns a shallow ref of the current connection state that
 * automatically updates when any part of the connection state changes (e.g.,
 * when going online/offline, when requests start/complete, etc.).
 *
 * The shape of ConnectionState may change in the future which may cause this
 * composable to update more frequently.
 *
 * Throws an error if no Convex client has been provided.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const conn = useConvexConnectionState()
 * </script>
 *
 * <template>
 *   <span v-if="!conn.isWebSocketConnected">Offline</span>
 * </template>
 * ```
 *
 * @returns The current {@link ConnectionState} with the Convex backend.
 *
 * @public
 */
export function useConvexConnectionState(): ShallowRef<ConnectionState> {
  const convex = useConvexOrThrow('useConvexConnectionState')

  // Upstream's `useCallback` wrappers are dropped — a composable runs once
  // per setup, so these closures are already stable.
  const getCurrentValue = () => {
    return convex.connectionState()
  }

  const subscribe = (callback: () => void) => {
    return convex.subscribeToConnectionState(() => {
      callback()
    })
  }

  return useSubscription({ getCurrentValue, subscribe })
}
