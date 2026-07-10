/**
 * Tools to integrate Convex into Vue applications.
 *
 * This module contains:
 * 1. {@link ConvexVueClient}, a client for using Convex in Vue.
 * 2. {@link ConvexClientKey}, an injection key that stores this client in Vue context.
 * 3. {@link Authenticated}, {@link Unauthenticated}, {@link AuthLoading} and {@link AuthRefreshing} helper auth components.
 * 4. Composables {@link useQuery}, {@link useMutation}, {@link useAction} and more for accessing this
 *    client from your Vue components.
 *
 * ## Usage
 *
 * ### Creating the client
 *
 * ```typescript
 * import { ConvexVueClient } from "nuxt-convex-module/client";
 *
 * // typically loaded from an environment variable
 * const address = "https://small-mouse-123.convex.cloud"
 * const convex = new ConvexVueClient(address);
 * ```
 *
 * ### Storing the client in Vue context
 *
 * ```typescript
 * import { ConvexClientKey } from "nuxt-convex-module/client";
 *
 * // (the Nuxt module registers a plugin that does this automatically)
 * app.provide(ConvexClientKey, convex);
 * ```
 *
 * ### Using the auth helpers
 *
 * ```typescript
 * import { Authenticated, Unauthenticated, AuthLoading, AuthRefreshing } from "nuxt-convex-module/client";
 *
 * <Authenticated>
 *   Logged in
 * </Authenticated>
 * <Unauthenticated>
 *   Logged out
 * </Unauthenticated>
 * <AuthLoading>
 *   Still loading
 * </AuthLoading>
 * <AuthRefreshing>
 *   Refreshing token...
 * </AuthRefreshing>
 * ```
 *
 * ### Using Vue composables
 *
 * ```typescript
 * import { useQuery, useMutation } from "nuxt-convex-module/client";
 * import { api } from "../convex/_generated/api";
 *
 * // In your component's <script setup>:
 * const counter = useQuery(api.getCounter.default);
 * const increment = useMutation(api.incrementCounter.default);
 * // Your component here!
 * ```
 * @module client
 */
export * from './composables/use-paginated-query'
// Upstream: use_paginated_query2.ts — merged into use-paginated-query.ts (see PARITY.md).
export {
  usePaginatedQuery_experimental,
  type UsePaginatedQueryOptions,
  type UsePaginatedQueryObjectReturnType,
} from './composables/use-paginated-query'
export { usePaginatedQuery } from './composables/use-paginated-query'
export { useQueries, type RequestForQueries } from './composables/use-queries'
export type { AuthTokenFetcher } from 'convex/browser'
export * from './auth/helpers'
export * from './auth'
// Named (not `export *`): vue/hydration.ts also exports port-internal helpers.
export { usePreloadedQuery, type Preloaded } from './hydration'
/* @internal */
export { useSubscription } from './composables/use-subscription'
// Upstream exports the block below from client.ts; the port hosts the
// composables in vue/composables/* files (see PARITY.md), so the same symbols
// follow in upstream's order, re-exported per source file.
export { type VueMutation } from './composables/use-mutation'
export { type VueAction } from './composables/use-action'
export {
  type Watch,
  type WatchQueryOptions,
  type MutationOptions,
  type ConvexVueClientOptions,
} from './client'
export {
  type OptionalRestArgsOrSkip,
  type UseQueryResult,
} from './composables/use-query'
export {
  ConvexVueClient,
  useConvex,
  // Upstream: `ConvexProvider` — the plugin provides the client via this key.
  ConvexClientKey,
} from './client'
export { useQuery, useQuery_experimental } from './composables/use-query'
export { useMutation } from './composables/use-mutation'
export { useAction } from './composables/use-action'
export { useConvexConnectionState } from './composables/use-connection-state'
// `convexQueryOptions` (marked `@internal` upstream) is deliberately not ported — see PARITY.md.
export type { QueryOptions } from 'convex/browser'

// --- Vue-only additions beyond the upstream `convex/react` index surface ---
// (see PARITY.md "Vue-only additions"; keep grouped here, after the mirrored exports)

// `useConvex*` aliases avoid name clashes with other auto-imported composables.
export { useConvexQueries } from './composables/use-queries'
export { useConvexQuery } from './composables/use-query'
export { useConvexMutation } from './composables/use-mutation'
export { useConvexAction } from './composables/use-action'

// Barrel type conveniences from the client module.
// `VueMutationOptions` is the Vue-family alias of upstream's `MutationOptions`
// (same treatment as `VueMutation` / `VueAction`).
export {
  type PaginatedWatch,
  type VueMutationOptions,
  type ConvexLogger,
} from './client'

// Type re-exports for convenience.
export type {
  ConnectionState,
  OptimisticUpdate,
  QueryJournal,
} from 'convex/browser'
export type {
  FunctionReference,
  FunctionArgs,
  FunctionReturnType,
  OptionalRestArgs,
  ArgsAndOptions,
} from 'convex/server'
export type { Value } from 'convex/values'

// File Storage helpers (not in `convex/react`).
export {
  useUpload,
  useConvexUpload,
  uploadFile,
  type VueUpload,
  type UseUploadOptions,
  type UploadFileOptions,
  type GenerateUploadUrl,
  type StorageId,
} from './composables/use-upload'
export {
  useUploadQueue,
  useConvexUploadQueue,
  type VueUploadQueue,
  type UseUploadQueueOptions,
  type UploadQueueItem,
  type UploadItemStatus,
} from './composables/use-upload-queue'
export {
  useStorageUrl,
  useConvexStorageUrl,
  type GetStorageUrl,
} from './composables/use-storage-url'

// App API wiring (provide/consume the generated Convex `api`).
export {
  provideConvexApi,
  useConvexApi,
  useConvexNamespace,
  ConvexApiKey,
  type ConvexApi,
} from './provide'
