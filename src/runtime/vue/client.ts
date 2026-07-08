import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import { BaseConvexClient } from 'convex/browser'
import type {
  AuthTokenFetcher,
  BaseConvexClientOptions,
  ConnectionState,
  OptimisticUpdate,
  PaginationStatus,
  QueryJournal,
  QueryOptions,
  QueryToken,
} from 'convex/browser'
import type { Watch as ConvexWatch } from 'convex/react'
import type {
  ArgsAndOptions,
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
  UserIdentityAttributes,
} from 'convex/server'
import { getFunctionName } from 'convex/server'
import type { Value } from 'convex/values'

export type { AuthTokenFetcher, ConnectionState, OptimisticUpdate }

// When no arguments are passed, extend subscriptions (for APIs that do this by default)
// for this amount after the subscription would otherwise be dropped.
const DEFAULT_EXTEND_SUBSCRIPTION_FOR = 5_000

// Upstream declares its hooks in this file; the port splits them into
// composable modules (documented split): `ReactMutation`/`createMutation` →
// `VueMutation`/`createMutation` in ./composables/use-mutation, `ReactAction`/
// `createAction` → `VueAction` in ./composables/use-action, `useQuery`/
// `useQuery_experimental` (+ `OptionalRestArgsOrSkip`, `UseQueryResult`) in
// ./composables/use-query and `useConvexConnectionState` in
// ./composables/use-connection-state.

// Watches should be stateless: in QueriesObserver we create a watch just to get
// the current value.
/**
 * A watch on the output of a Convex query function.
 *
 * Derived from upstream's `Watch` (per-member docs live there), extended with
 * the `@internal` `localQueryLogs`, which is stripped from the published
 * `convex/react` types but present at runtime.
 *
 * @public
 */
export interface Watch<T> extends ConvexWatch<T> {
  /**
   * @internal
   */
  localQueryLogs(): string[] | undefined
}

/**
 * A watch on the output of a paginated Convex query function.
 *
 * @public
 */
export interface PaginatedWatch<T> {
  /**
   * Initiate a watch on the output of a paginated query.
   *
   * This will subscribe to this query and call
   * the callback whenever the query result changes.
   *
   * @param callback - Function that is called whenever the query result changes.
   * @returns - A function that disposes of the subscription.
   */
  onUpdate(callback: () => void): () => void

  /**
   * Get the current result of a paginated query.
   *
   * @returns The current results, status, and loadMore function, or `undefined` if not loaded.
   */
  localQueryResult():
    | {
      results: T[]
      status: PaginationStatus
      // Upstream: `LoadMoreOfPaginatedQuery` — not a public convex export, inlined.
      loadMore: (numItems: number) => boolean
    }
    | undefined
}

/**
 * Options for {@link ConvexVueClient.watchQuery}.
 *
 * @public
 */
export interface WatchQueryOptions {
  /**
   * An (optional) journal produced from a previous execution of this query
   * function.
   *
   * If there is an existing subscription to a query function with the same
   * name and arguments, this journal will have no effect.
   */
  journal?: QueryJournal

  /**
   * @internal
   */
  componentPath?: string
}

/**
 * Options for {@link ConvexVueClient.mutation}.
 *
 * @public
 */
export interface MutationOptions<Args extends Record<string, Value>> {
  /**
   * An optimistic update to apply along with this mutation.
   *
   * An optimistic update locally updates queries while a mutation is pending.
   * Once the mutation completes, the update will be rolled back.
   */
  optimisticUpdate?: OptimisticUpdate<Args> | undefined
}

// Vue-family alias of upstream's `MutationOptions` (same treatment as
// `VueMutation` / `VueAction`); the barrel re-exports both names.
// fallow-ignore-next-line unused-type
export type VueMutationOptions<Args extends Record<string, Value>> = MutationOptions<Args>

/**
 * Options for {@link ConvexVueClient}.
 *
 * @public
 */
// Mirrors `ConvexReactClientOptions`: an (intentionally empty) interface rather
// than a type alias, so consumers can augment it and the public surface matches
// the React client.

export interface ConvexVueClientOptions extends BaseConvexClientOptions {}

/**
 * The logger type accepted by {@link ConvexVueClientOptions.logger} — the
 * public shape of convex's non-exported `Logger`.
 *
 * @public
 */
export type ConvexLogger = Exclude<BaseConvexClientOptions['logger'], boolean | undefined>

// Stand-ins for convex's non-exported `instantiateNoopLogger` /
// `instantiateDefaultLogger` helpers (browser/logging.ts), reconstructed from
// the public `Logger` shape: `logVerbose` lines are only emitted when
// `verbose` is enabled.
function instantiateNoopLogger(_options: { verbose: boolean }): ConvexLogger {
  return {
    logVerbose() {},
    log() {},
    warn() {},
    error() {},
  }
}

function instantiateDefaultLogger({ verbose }: { verbose: boolean }): ConvexLogger {
  return {
    logVerbose: (...args) => {
      if (verbose) console.debug(...args)
    },
    log: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
  }
}

// The published `BaseConvexClient` types omit these `@internal` members
// (present at runtime and used directly by upstream `ConvexReactClient`).
interface SyncClientWithInternals extends BaseConvexClient {
  setAdminAuth(token: string, identity?: UserIdentityAttributes): void
  localQueryLogs(udfPath: string, args?: Record<string, Value>): string[] | undefined
}

/**
 * A Convex client for use within Vue.
 *
 * This loads reactive queries and executes mutations over a WebSocket.
 *
 * In a Nuxt app the client is provided automatically by the plugin and
 * available via the {@link useConvex} composable or `useNuxtApp().$convex`.
 *
 * @public
 */
export class ConvexVueClient {
  private address: string
  private cachedSync?: BaseConvexClient | undefined
  // No `cachedPaginatedQueryClient`: convex's `PaginatedQueryClient` is not a
  // public export — pagination lives in the `usePaginatedQuery` composable
  // layer (see {@link watchPaginatedQuery}). `PaginatedQueryToken` is likewise
  // not exported, so listener keys are plain `QueryToken`s.
  private listeners: Map<QueryToken, Set<() => void>>
  private options: ConvexVueClientOptions
  // "closed" means this client is done, not just that the underlying WS connection is closed.
  private closed = false
  private _logger: ConvexLogger

  private adminAuth?: string
  private fakeUserIdentity?: UserIdentityAttributes | undefined

  /**
   * @param address - The url of your Convex deployment, often provided
   * by an environment variable. E.g. `https://small-mouse-123.convex.cloud`.
   * @param options - See {@link ConvexVueClientOptions} for a full description.
   */
  constructor(address: string, options?: ConvexVueClientOptions) {
    // Validate address immediately since validation by the lazily-instantiated
    // internal client does not occur synchronously.
    if (address === undefined) {
      throw new Error(
        'No address provided to ConvexVueClient.\n'
        + 'If trying to deploy to production, make sure to follow all the instructions found at https://docs.convex.dev/production/hosting/\n'
        + 'If running locally, make sure to run `convex dev` and ensure the .env.local file is populated.',
      )
    }
    if (typeof address !== 'string') {
      throw new Error(
        `ConvexVueClient requires a URL like 'https://happy-otter-123.convex.cloud', received something of type ${typeof address} instead.`,
      )
    }
    if (!address.includes('://')) {
      throw new Error('Provided address was not an absolute URL.')
    }
    this.address = address
    this.listeners = new Map()
    // The resolved logger is also handed to the underlying BaseConvexClient
    // via `options.logger`, so client-level and SDK-level logging share one
    // instance — same wiring as upstream's `_logger`.
    this._logger
      = options?.logger === false
        ? instantiateNoopLogger({ verbose: options?.verbose ?? false })
        : options?.logger !== true && options?.logger
          ? options.logger
          : instantiateDefaultLogger({ verbose: options?.verbose ?? false })
    this.options = { ...options, logger: this._logger }
  }

  /**
   * Return the address for this client, useful for creating a new client.
   *
   * Not guaranteed to match the address with which this client was constructed:
   * it may be canonicalized.
   */
  get url() {
    return this.address
  }

  /**
   * Lazily instantiate the `BaseConvexClient` so we don't create the WebSocket
   * when server-side rendering.
   *
   * @internal
   */
  get sync() {
    if (this.closed) {
      throw new Error('ConvexVueClient has already been closed.')
    }
    if (this.cachedSync) {
      return this.cachedSync
    }
    // Unlike upstream — which passes a no-op handler here and routes every
    // transition through its internal (non-public) PaginatedQueryClient — the
    // base client's transition callback is wired straight to `transition()`;
    // pagination is handled in the `usePaginatedQuery` composable layer.
    this.cachedSync = new BaseConvexClient(
      this.address,
      updatedQueries => this.transition(updatedQueries),
      this.options,
    )
    if (this.adminAuth) {
      const sync = this.cachedSync as SyncClientWithInternals
      sync.setAdminAuth(this.adminAuth, this.fakeUserIdentity)
    }
    return this.cachedSync
  }

  /**
   * Set the authentication token to be used for subsequent queries and mutations.
   * `fetchToken` will be called automatically again if a token expires.
   * `fetchToken` should return `null` if the token cannot be retrieved, for example
   * when the user's rights were permanently revoked.
   * @param fetchToken - an async function returning the JWT-encoded OpenID Connect Identity Token
   * @param onChange - a callback that will be called when the authentication status changes
   * @param onRefreshChange - a callback called with `true` when the socket is paused to fetch a replacement token after a server rejection, and `false` when refresh completes
   */
  setAuth(
    fetchToken: AuthTokenFetcher,
    onChange?: (isAuthenticated: boolean) => void,
    onRefreshChange?: (isRefreshing: boolean) => void,
  ) {
    if (typeof fetchToken === 'string') {
      throw new Error(
        'Passing a string to ConvexVueClient.setAuth is no longer supported, '
        + 'please upgrade to passing in an async function to handle reauthentication.',
      )
    }
    this.sync.setAuth(
      fetchToken,
      onChange
      ?? (() => {
        // Do nothing
      }),
      onRefreshChange,
    )
  }

  /**
   * Clear the current authentication token if set.
   */
  clearAuth() {
    this.sync.clearAuth()
  }

  /**
   * @internal
   */
  setAdminAuth(token: string, identity?: UserIdentityAttributes) {
    this.adminAuth = token
    this.fakeUserIdentity = identity
    if (this.closed) {
      throw new Error('ConvexVueClient has already been closed.')
    }
    if (this.cachedSync) {
      const sync = this.sync as SyncClientWithInternals
      sync.setAdminAuth(token, identity)
    }
  }

  /**
   * Construct a new {@link Watch} on a Convex query function.
   *
   * **Most application code should not call this method directly. Instead use
   * the {@link useQuery} composable.**
   *
   * The act of creating a watch does nothing, a Watch is stateless.
   *
   * @param query - A {@link server.FunctionReference} for the public query to run.
   * @param args - An arguments object for the query. If this is omitted,
   * the arguments will be `{}`.
   * @param options - A {@link WatchQueryOptions} options object for this query.
   *
   * @returns The {@link Watch} object.
   */
  watchQuery<Query extends FunctionReference<'query'>>(
    query: Query,
    ...argsAndOptions: ArgsAndOptions<Query, WatchQueryOptions>
  ): Watch<FunctionReturnType<Query>> {
    const [args, options] = argsAndOptions
    const name = getFunctionName(query)

    return {
      onUpdate: (callback) => {
        const { queryToken, unsubscribe } = this.sync.subscribe(
          name as string,
          args,
          options,
        )

        const currentListeners = this.listeners.get(queryToken)
        if (currentListeners !== undefined) {
          currentListeners.add(callback)
        }
        else {
          this.listeners.set(queryToken, new Set([callback]))
        }

        return () => {
          if (this.closed) {
            return
          }

          const currentListeners = this.listeners.get(queryToken)!
          currentListeners.delete(callback)
          if (currentListeners.size === 0) {
            this.listeners.delete(queryToken)
          }
          unsubscribe()
        }
      },

      localQueryResult: () => {
        // Use the cached client because we can't have a query result if we don't
        // even have a client yet!
        if (this.cachedSync) {
          // The published `localQueryResult` is typed `Value | undefined`.
          return this.cachedSync.localQueryResult(name, args) as FunctionReturnType<Query> | undefined
        }
        return undefined
      },

      localQueryLogs: () => {
        if (this.cachedSync) {
          return (this.cachedSync as SyncClientWithInternals).localQueryLogs(name, args)
        }
        return undefined
      },

      journal: () => {
        if (this.cachedSync) {
          return this.cachedSync.queryJournal(name, args)
        }
        return undefined
      },
    }
  }

  // Let's try out a queryOptions-style API.
  // This method is similar to the React Query API `queryClient.prefetchQuery()`.
  // In the future an ensureQueryData(): Promise<Data> method could exist.
  /**
   * Indicates likely future interest in a query subscription.
   *
   * The implementation currently immediately subscribes to a query. In the future this method
   * may prioritize some queries over others, fetch the query result without subscribing, or
   * do nothing in slow network connections or high load scenarios.
   *
   * To use this in a Vue component, call useQuery() and ignore the return value.
   *
   * @param queryOptions - A query (function reference from an api object) and its args, plus
   * an optional extendSubscriptionFor for how long to subscribe to the query.
   */
  prewarmQuery<Query extends FunctionReference<'query'>>(
    queryOptions: QueryOptions<Query> & { extendSubscriptionFor?: number },
  ) {
    const extendSubscriptionFor
      = queryOptions.extendSubscriptionFor ?? DEFAULT_EXTEND_SUBSCRIPTION_FOR
    const watch = this.watchQuery(queryOptions.query, queryOptions.args || {})
    const unsubscribe = watch.onUpdate(() => {})
    setTimeout(unsubscribe, extendSubscriptionFor)
  }

  /**
   * Construct a new {@link PaginatedWatch} on a Convex paginated query function.
   *
   * **Not supported in the Vue port — use the {@link usePaginatedQuery}
   * composable instead.** Convex's paginated-subscription engine
   * (`PaginatedQueryClient`) is not part of the public `convex` exports, so a
   * third-party package cannot instantiate it; pagination is handled entirely
   * in the composable layer via ordinary {@link watchQuery} subscriptions.
   *
   * The method is retained for structural parity with
   * `ConvexReactClient.watchPaginatedQuery`. It is reachable only if a caller
   * passes `paginationOptions` to {@link useConvexQueries} (the React-shaped
   * escape hatch); doing so throws this error to fail loudly rather than
   * silently mis-subscribe.
   *
   * @internal
   */
  watchPaginatedQuery<Query extends FunctionReference<'query'>>(
    _query: Query,
    _args: Query['_args'],
    // Upstream: `options: WatchPaginatedQueryOptions` (`@internal`, stripped
    // from the published types); typed loosely since this method only throws.
    _options: unknown,
  ): PaginatedWatch<FunctionReturnType<Query>> {
    throw new Error(
      'ConvexVueClient.watchPaginatedQuery is not supported: Convex\'s internal '
      + 'PaginatedQueryClient is not part of the public API. Use the '
      + '`usePaginatedQuery` composable for paginated queries.',
    )
  }

  /**
   * Execute a mutation function.
   *
   * @param mutation - A {@link server.FunctionReference} for the public mutation
   * to run.
   * @param args - An arguments object for the mutation. If this is omitted,
   * the arguments will be `{}`.
   * @param options - A {@link MutationOptions} options object for the mutation.
   * @returns A promise of the mutation's result.
   */
  mutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    ...argsAndOptions: ArgsAndOptions<
      Mutation,
      MutationOptions<FunctionArgs<Mutation>>
    >
  ): Promise<FunctionReturnType<Mutation>> {
    const [args, options] = argsAndOptions
    const name = getFunctionName(mutation)
    return this.sync.mutation(name, args, options)
  }

  /**
   * Execute an action function.
   *
   * @param action - A {@link server.FunctionReference} for the public action
   * to run.
   * @param args - An arguments object for the action. If this is omitted,
   * the arguments will be `{}`.
   * @returns A promise of the action's result.
   */
  action<Action extends FunctionReference<'action'>>(
    action: Action,
    ...args: OptionalRestArgs<Action>
  ): Promise<FunctionReturnType<Action>> {
    const name = getFunctionName(action)
    return this.sync.action(name, ...args)
  }

  /**
   * Fetch a query result once.
   *
   * **Most application code should subscribe to queries instead, using
   * the {@link useQuery} composable.**
   *
   * @param query - A {@link server.FunctionReference} for the public query
   * to run.
   * @param args - An arguments object for the query. If this is omitted,
   * the arguments will be `{}`.
   * @returns A promise of the query's result.
   */
  query<Query extends FunctionReference<'query'>>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Promise<FunctionReturnType<Query>> {
    const watch = this.watchQuery(query, ...args)
    const existingResult = watch.localQueryResult()
    if (existingResult !== undefined) {
      return Promise.resolve(existingResult)
    }
    return new Promise((resolve, reject) => {
      const unsubscribe = watch.onUpdate(() => {
        unsubscribe()
        try {
          // `localQueryResult` is `T | undefined`; the update guarantees a result.
          resolve(watch.localQueryResult() as FunctionReturnType<Query>)
        }
        catch (e) {
          reject(e)
        }
      })
    })
  }

  /**
   * Get the current {@link ConnectionState} between the client and the Convex
   * backend.
   *
   * @returns The {@link ConnectionState} with the Convex backend.
   */
  connectionState(): ConnectionState {
    return this.sync.connectionState()
  }

  /**
   * Subscribe to the {@link ConnectionState} between the client and the Convex
   * backend, calling a callback each time it changes.
   *
   * Subscribed callbacks will be called when any part of ConnectionState changes.
   * ConnectionState may grow in future versions (e.g. to provide a array of
   * inflight requests) in which case callbacks would be called more frequently.
   * ConnectionState may also *lose* properties in future versions as we figure
   * out what information is most useful. As such this API is considered unstable.
   *
   * @returns An unsubscribe function to stop listening.
   */
  subscribeToConnectionState(
    cb: (connectionState: ConnectionState) => void,
  ): () => void {
    return this.sync.subscribeToConnectionState(cb)
  }

  /**
   * Get the logger for this client.
   *
   * @returns The {@link ConvexLogger} for this client.
   */
  get logger(): ConvexLogger {
    return this._logger
  }

  /**
   * Close any network handles associated with this client and stop all subscriptions.
   *
   * Call this method when you're done with a {@link ConvexVueClient} to
   * dispose of its sockets and resources.
   *
   * @returns A `Promise` fulfilled when the connection has been completely closed.
   */
  async close(): Promise<void> {
    this.closed = true
    // Prevent outstanding Vue batched updates from invoking listeners.
    this.listeners = new Map()
    if (this.cachedSync) {
      const sync = this.cachedSync
      this.cachedSync = undefined
      await sync.close()
    }
  }

  private transition(updatedQueries: QueryToken[]) {
    for (const queryToken of updatedQueries) {
      const callbacks = this.listeners.get(queryToken)
      if (callbacks) {
        for (const callback of callbacks) {
          callback()
        }
      }
    }
  }
}

// The Vue analog of upstream's `ConvexContext` / `<ConvexProvider>` pair: the
// client travels via provide/inject, with the Nuxt plugin (or a manual
// `provide(ConvexClientKey, client)`) playing the provider role.
/**
 * Vue injection key for the {@link ConvexVueClient}.
 *
 * @public
 */
export const ConvexClientKey: InjectionKey<ConvexVueClient> = Symbol('ConvexVueClient')

/**
 * Get the {@link ConvexVueClient} within a Vue component.
 *
 * This relies on the client having been provided under {@link ConvexClientKey}
 * (the Nuxt plugin does this automatically).
 *
 * @returns The active {@link ConvexVueClient} object, or `undefined`.
 *
 * @public
 */
export function useConvex(): ConvexVueClient {
  // Pass an explicit default so Vue doesn't emit its own generic
  // "injection not found" warning. Mirrors React's `useContext`, which
  // returns the (possibly undefined) context value silently — upstream's
  // declared return type is also non-optional while the JSDoc documents the
  // `undefined` case.
  return inject(ConvexClientKey, undefined) as ConvexVueClient
}

/**
 * Inject the Convex client for a composable, throwing the per-composable
 * missing-client error when absent — mirrors the checks at the top of
 * upstream's `useQuery`/`useMutation`/`useAction`/`useConvexConnectionState`.
 *
 * @internal
 */
export function useConvexOrThrow(composableName: string): ConvexVueClient {
  const client = inject(ConvexClientKey, undefined)
  if (client === undefined) {
    throw new Error(
      `Could not find Convex client! \`${composableName}\` must be used in the Vue component `
      + 'tree where the Convex client has been provided — in Nuxt, install the `nuxt-convex-module` '
      + 'module (or `provide(ConvexClientKey, client)`). Did you forget it? '
      + 'See https://docs.convex.dev/quick-start',
    )
  }
  return client
}
