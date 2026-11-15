/**
 * A Vue port of `@convex-dev/presence/react`: {@link usePresence}.
 *
 * @module presence/client
 */
import { getFunctionName, type FunctionReference } from 'convex/server'
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useConvex } from '../../vue/client'
import { useMutation } from '../../vue/composables/use-mutation'
import { useQuery } from '../../vue/composables/use-query'
import useSingleFlight from './use-single-flight'

// Interface in your Convex app /convex directory that implements these
// functions by calling into the presence component, e.g., like this:
//
// export const presence = new Presence(components.presence);
//
// export const heartbeat = mutation({
//   args: { roomId: v.string(), userId: v.string(), sessionId: v.string(), interval: v.number() },
//   handler: async (ctx, { roomId, userId, sessionId, interval }) => {
//     // TODO: Add your auth checks here.
//     return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
//   },
// });
//
// export const list = query({
//   args: { roomToken: v.string() },
//   handler: async (ctx, { roomToken }) => {
//     // Avoid adding per-user reads so all subscriptions can share same cache.
//     return await presence.list(ctx, roomToken);
//   },
// });
//
// export const disconnect = mutation({
//   args: { sessionToken: v.string() },
//   handler: async (ctx, { sessionToken }) => {
//     // Can't check auth here because it's called over http from sendBeacon.
//     return await presence.disconnect(ctx, sessionToken);
//   },
// });
/**
 * The presence functions of a Convex app, usually `api.presence`.
 *
 * @public
 */
export interface PresenceAPI {
  list: FunctionReference<
    'query',
    'public',
    { roomToken: string },
    PresenceState[]
  >
  heartbeat: FunctionReference<
    'mutation',
    'public',
    { roomId: string, userId: string, sessionId: string, interval: number },
    { roomToken: string, sessionToken: string }
  >
  disconnect: FunctionReference<'mutation', 'public', { sessionToken: string }>
}

/**
 * Presence state for a user within the given room.
 *
 * @public
 */
export interface PresenceState {
  userId: string
  online: boolean
  lastDisconnected: number
  data?: unknown
  // Set these accordingly in your Convex app.
  // See ../../example-with-auth/convex/presence.ts for an example.
  name?: string
  image?: string
}

/**
 * Vue composable for maintaining presence state.
 *
 * This composable is designed to be efficient and only sends a message to
 * users whenever a member joins or leaves the room, not on every heartbeat.
 *
 * Use of this composable requires passing in a reference to the Convex
 * presence component defined in your Convex app.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '~~/convex/_generated/api'
 *
 * const presenceState = usePresence(api.presence, 'my-chat-room', name)
 * </script>
 *
 * <template>
 *   <FacePile :presence-state="presenceState ?? []" />
 * </template>
 * ```
 *
 * @param presence The presence functions of the app, usually `api.presence`.
 * @param roomId The room, as a value, a ref or a getter.
 * @param userId The user, as a value, a ref or a getter.
 * @param interval Milliseconds between heartbeats. Default 10000.
 * @param convexUrl The deployment URL the unload beacon goes to. Defaults to the client's.
 * @returns A ref of the room's users, the current user first, or `undefined` while loading.
 * @public
 */
export function usePresence(
  presence: PresenceAPI,
  roomId: MaybeRefOrGetter<string>,
  userId: MaybeRefOrGetter<string>,
  interval: MaybeRefOrGetter<number> = 10000,
  convexUrl?: MaybeRefOrGetter<string | undefined>,
): ComputedRef<PresenceState[] | undefined> {
  const convex = useConvex()
  const baseUrl = computed(() => toValue(convexUrl) ?? convex!.url)

  // Each composable instance has a stable ID. Including the room and user
  // gives each presence identity a distinct server session.
  const instanceId = crypto.randomUUID()
  const sessionId = computed(() => JSON.stringify([instanceId, toValue(roomId), toValue(userId)]))
  // A ref stands in for upstream's state and its ref mirror both: the
  // callbacks below read the current value.
  const sessionToken = ref<string | null>(null)
  // A newer run may adopt the same session when only `interval` changes.
  let activeSessionId: string | null = null

  const roomToken = ref<string | null>(null)

  let intervalHandle: ReturnType<typeof setInterval> | null = null

  const heartbeat = useSingleFlight(useMutation(presence.heartbeat))
  const disconnect = useMutation(presence.disconnect)
  // PARITY: F-06
  // Fixes an upstream bug: the beacon names `presence:disconnect`, whatever
  // module the given `disconnect` lives in.
  const disconnectPath = getFunctionName(presence.disconnect)

  // PARITY: D-01
  // Upstream runs this in an effect, which React never runs on the server.
  if (!import.meta.server) {
    watch(
      [() => toValue(roomId), () => toValue(userId), baseUrl, () => toValue(interval), sessionId],
      ([currentRoomId, currentUserId, currentBaseUrl, currentInterval, currentSessionId], previous, onCleanup) => {
        if (previous[0] !== currentRoomId || previous[1] !== currentUserId) {
          // The cleanup below ends the old session.
          sessionToken.value = null
          roomToken.value = null
        }

        let canceled = false
        activeSessionId = currentSessionId

        const disconnectIfOrphaned = (token: string) => {
          queueMicrotask(() => {
            if (activeSessionId !== currentSessionId) {
              void disconnect({ sessionToken: token })
            }
          })
        }

        // Periodic heartbeats.
        const sendHeartbeat = async () => {
          const result = await heartbeat({ roomId: currentRoomId, userId: currentUserId, sessionId: currentSessionId, interval: currentInterval })
          if (canceled) {
            disconnectIfOrphaned(result.sessionToken)
            return
          }
          roomToken.value = result.roomToken
          sessionToken.value = result.sessionToken
        }

        // Send initial heartbeat
        void sendHeartbeat()

        // Clear any existing interval before setting a new one
        if (intervalHandle) {
          clearInterval(intervalHandle)
        }
        intervalHandle = setInterval(sendHeartbeat, currentInterval)

        // Handle page unload.
        const handleUnload = () => {
          if (sessionToken.value) {
            const blob = new Blob(
              [
                JSON.stringify({
                  path: disconnectPath,
                  args: { sessionToken: sessionToken.value },
                }),
              ],
              {
                type: 'application/json',
              },
            )
            navigator.sendBeacon(`${currentBaseUrl}/api/mutation`, blob)
          }
        }
        window.addEventListener('beforeunload', handleUnload)

        // Handle visibility changes.
        const handleVisibility = async () => {
          if (document.hidden) {
            if (intervalHandle) {
              clearInterval(intervalHandle)
              intervalHandle = null
            }
            if (sessionToken.value) {
              await disconnect({ sessionToken: sessionToken.value })
            }
          }
          else {
            void sendHeartbeat()
            if (intervalHandle) {
              clearInterval(intervalHandle)
            }
            intervalHandle = setInterval(sendHeartbeat, currentInterval)
          }
        }
        const wrappedHandleVisibility = () => {
          handleVisibility().catch(console.error)
        }
        document.addEventListener('visibilitychange', wrappedHandleVisibility)

        // Cleanup.
        onCleanup(() => {
          canceled = true
          activeSessionId = null
          const token = sessionToken.value
          if (intervalHandle) {
            clearInterval(intervalHandle)
          }
          document.removeEventListener('visibilitychange', wrappedHandleVisibility)
          window.removeEventListener('beforeunload', handleUnload)
          if (token) {
            disconnectIfOrphaned(token)
          }
        })
      },
      { immediate: true },
    )
  }

  const state = useQuery(presence.list, () => (roomToken.value ? { roomToken: roomToken.value } : 'skip'))
  return computed(() =>
    state.value?.slice().sort((a, b) => {
      const current = toValue(userId)
      if (a.userId === current) return -1
      if (b.userId === current) return 1
      return 0
    }),
  )
}

// fallow-ignore-next-line duplicate-export-alias -- upstream's entry exports it as the default; the name is for auto-imports
export default usePresence
