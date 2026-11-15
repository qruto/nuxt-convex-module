/**
 * The query cache of `convex-helpers/react/cache/provider`:
 * {@link provideConvexQueryCache} and `<ConvexQueryCacheProvider>`.
 */
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReference_future,
} from 'convex/server'
import { defineComponent, provide, type InjectionKey } from 'vue'
import { useConvex, type ConvexVueClient } from '../../../vue/client'

/**
 * The injection key {@link provideConvexQueryCache} provides the cache under:
 * the Vue counterpart of upstream's `ConvexQueryCacheContext`.
 *
 * @public
 */
export const ConvexQueryCacheKey: InjectionKey<{ registry: CacheRegistry | null }> = Symbol('convex-helpers:query-cache')

/**
 * Establish a query cache for the component's descendants, so that cached
 * `useQuery` calls can be used: a port of upstream's
 * `<ConvexQueryCacheProvider>`.
 *
 * @param options - Options for the query cache
 * @public
 */
export function provideConvexQueryCache(options: ConvexQueryCacheOptions = {}): void {
  const { debug, expiration, maxIdleEntries } = options
  const convex = useConvex()
  if (convex === undefined) {
    throw new Error(
      'Could not find Convex client! `ConvexQueryCacheProvider` must be used in the Vue component '
      + 'tree under the Convex client. Did you forget it? '
      + 'See https://docs.convex.dev/quick-start',
    )
  }
  const registry = new CacheRegistry(convex, { debug, expiration, maxIdleEntries })
  provide(ConvexQueryCacheKey, { registry })
}

/**
 * A thin component over {@link provideConvexQueryCache}, for templates that
 * mirror upstream's `<ConvexQueryCacheProvider>`.
 *
 * @public
 */
export const ConvexQueryCacheProvider = defineComponent({
  name: 'ConvexQueryCacheProvider',
  props: {
    debug: { type: Boolean, default: undefined },
    expiration: { type: Number, default: undefined },
    maxIdleEntries: { type: Number, default: undefined },
  },
  setup(props, { slots }) {
    provideConvexQueryCache({
      debug: props.debug,
      expiration: props.expiration,
      maxIdleEntries: props.maxIdleEntries,
    })
    return () => slots.default?.()
  },
})

const DEFAULT_EXPIRATION_MS = 300_000 // 5 minutes
const DEFAULT_MAX_ENTRIES = 250

/** @public */
export type ConvexQueryCacheOptions = {
  /**
   * How long, in milliseconds, to keep the subscription to the convex
   * query alive even after all references in the app have been dropped.
   *
   * @default 300000
   */
  expiration?: number

  /**
   * How many "extra" idle query subscriptions are allowed to remain
   * connected to your convex backend.
   *
   * @default Infinity
   */
  maxIdleEntries?: number

  /**
   * A debug flag that will cause information about the query cache
   * to be logged to the console every 3 seconds.
   *
   * @default false
   */
  debug?: boolean
}

/**
 * Implementation of the query cache.
 */

type SubKey = string
type QueryKey = string
type CachedQuery = {
  refs: Set<string>
  evictTimer: number | null // SetTimeout
  unsub: () => void
}

// Core caching structure.
class CacheRegistry {
  queries: Map<QueryKey, CachedQuery>
  subs: Map<SubKey, QueryKey>
  convex: ConvexVueClient
  timeout: number
  maxIdleEntries: number
  idle: number

  constructor(convex: ConvexVueClient, options: ConvexQueryCacheOptions) {
    this.queries = new Map()
    this.subs = new Map()
    this.convex = convex
    this.idle = 0
    this.timeout = options.expiration ?? DEFAULT_EXPIRATION_MS
    this.maxIdleEntries = options.maxIdleEntries ?? DEFAULT_MAX_ENTRIES
    if (options.debug ?? false) {
      const weakThis = new WeakRef(this)
      const debugInterval = setInterval(() => {
        const r = weakThis.deref()
        if (r === undefined) {
          clearInterval(debugInterval)
        }
        else {
          r.debug()
        }
      }, 3000)
    }
  }

  // Enable a new subscription.
  start<
    Query extends
    FunctionReference<'query'> | FunctionReference_future<'query'>,
  >(
    id: string,
    queryKey: string,
    query: Query,
    args: FunctionArgs<Query>,
  ): void {
    let entry = this.queries.get(queryKey)
    this.subs.set(id, queryKey)
    if (entry === undefined) {
      entry = {
        refs: new Set(),
        evictTimer: null,
        // We only need to hold open subscriptions, we don't care about updates.
        unsub: this.convex.watchQuery(query as FunctionReference<'query'>, args).onUpdate(() => {}),
      }
      this.queries.set(queryKey, entry)
    }
    else if (entry.evictTimer !== null) {
      this.idle -= 1
      clearTimeout(entry.evictTimer)
      entry.evictTimer = null
    }
    entry.refs.add(id)
  }

  // End a previous subscription.
  end(id: string) {
    const queryKey = this.subs.get(id)
    if (queryKey) {
      this.subs.delete(id)
      const cq = this.queries.get(queryKey)
      cq?.refs.delete(id)
      // None left?
      if (cq?.refs.size === 0) {
        const remove = () => {
          cq.unsub()
          this.queries.delete(queryKey)
        }
        if (this.idle == this.maxIdleEntries) {
          remove()
        }
        else {
          this.idle += 1
          const evictTimer = window.setTimeout(() => {
            this.idle -= 1
            remove()
          }, this.timeout)
          cq.evictTimer = evictTimer
        }
      }
    }
  }

  debug() {
    console.log('DEBUG CACHE')
    console.log(`IDLE = ${this.idle}`)
    console.log(' SUBS')
    for (const [k, v] of this.subs.entries()) {
      console.log(`  ${k} => ${v}`)
    }
    console.log(' QUERIES')
    for (const [k, v] of this.queries.entries()) {
      console.log(`  ${k} => ${v.refs.size} refs, evict = ${v.evictTimer}`)
    }
    console.log('~~~~~~~~~~~~~~~~~~~~~~')
  }
}
