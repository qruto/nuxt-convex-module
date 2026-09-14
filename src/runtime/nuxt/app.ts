/**
 * Composables that need the Nuxt app context (`#app`) — the half of the
 * package that runs in a Nuxt app but not in plain Vue.
 *
 * This module contains {@link useAsyncQuery}: server-rendered Convex data
 * that upgrades to a live subscription after hydration. It is auto-imported;
 * import it from here when you need the explicit path or one of its types.
 *
 * ## Usage
 *
 * ```vue
 * <script setup lang="ts">
 * import { useAsyncQuery, type AsyncQueryReturn } from 'nuxt-convex-module/app'
 * import { api } from '#convex/api'
 * import type { Doc } from '#convex/dataModel'
 *
 * const messages: AsyncQueryReturn<Doc<'messages'>[]> = useAsyncQuery(api.messages.list, {})
 * </script>
 * ```
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
