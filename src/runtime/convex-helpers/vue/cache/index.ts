/**
 * A Vue port of `convex-helpers/react/cache`: queries whose subscriptions
 * stay open for a while after the last component lets go, so a remount shows
 * the result at once.
 *
 * @module convex-helpers/cache
 */
export {
  ConvexQueryCacheKey,
  ConvexQueryCacheProvider,
  provideConvexQueryCache,
  type ConvexQueryCacheOptions,
} from './provider'
export { useQuery, useQueries, usePaginatedQuery } from './hooks'
