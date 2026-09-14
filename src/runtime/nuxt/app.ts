/**
 * Composables that need the Nuxt app context (`#app`) — the half of the
 * package that runs in a Nuxt app but not in plain Vue.
 *
 * This module contains {@link useAsyncQuery} and its paginated form
 * {@link useAsyncPaginatedQuery}: server-rendered Convex data that upgrades
 * to a live subscription after hydration.
 *
 * ## Usage
 *
 * **Default — auto-imported.** In any page, component or composable, call it
 * with no import; its types are auto-imported too:
 *
 * ```vue
 * <script setup lang="ts">
 * import { api } from '#convex/api'
 *
 * const { data: messages, status } = useAsyncQuery(api.messages.list, {})
 * // `AsyncQueryStatus`, `AsyncQueryReturn`, … resolve without an import as well:
 * const label = (s: AsyncQueryStatus) => s === 'pending' ? 'Loading…' : ''
 * </script>
 * ```
 *
 * **Explicit import — this subpath.** For a project that turns auto-imports
 * off, a file outside the app's auto-import scope, or an editor that wants
 * the import spelled out:
 *
 * ```ts
 * import { useAsyncQuery } from 'nuxt-convex-module/app'
 * ```
 *
 * **Types.** From `#imports` (Nuxt's auto-import barrel) or from this subpath,
 * whichever your file already uses:
 *
 * ```ts
 * import type { AsyncQueryReturn } from '#imports'
 * import type { AsyncQueryReturn } from 'nuxt-convex-module/app'
 *
 * const messages: AsyncQueryReturn<Doc<'messages'>[]> = useAsyncQuery(api.messages.list, {})
 * ```
 *
 * Before 1.0 the composable was auto-imported but reachable from no subpath,
 * so neither the explicit form nor the types could be written at all.
 *
 * @module app
 */

export {
  useAsyncQuery,
  useConvexAsyncQuery,
  type AsyncQueryData,
  type AsyncQueryOptions,
  type AsyncQueryReturn,
  type AsyncQueryStatus,
} from './composables/use-async-query'
export {
  useAsyncPaginatedQuery,
  useConvexAsyncPaginatedQuery,
  type AsyncPaginatedQueryData,
  type AsyncPaginatedQueryOptions,
  type AsyncPaginatedQueryReturn,
} from './composables/use-async-paginated-query'
