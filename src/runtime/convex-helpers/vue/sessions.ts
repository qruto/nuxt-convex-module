/**
 * Vue helpers for adding session data to Convex functions: a port of
 * `convex-helpers/react/sessions`.
 *
 * !Important!: To use these functions, call {@link provideSession} in a
 * component above the ones that use them, below the Convex client:
 * ```vue
 * <script setup lang="ts">
 * provideSession()
 * </script>
 * ```
 *
 * See the associated [Stack post](https://stack.convex.dev/track-sessions-without-cookies)
 * for more information.
 *
 * @module convex-helpers/sessions
 */
import type { OptimisticUpdate } from 'convex/browser'
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReference_future,
  FunctionReturnType,
  PaginationOptions,
  PaginationResult,
} from 'convex/server'
import type { BetterOmit, EmptyObject } from 'convex-helpers'
import type { SessionId } from 'convex-helpers/server/sessions'
import {
  computed,
  defineComponent,
  inject,
  onMounted,
  provide,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type PropType,
  type Ref,
} from 'vue'
import { ConvexVueClient, useConvex, type ConvexVueClientOptions, type MutationOptions } from '../../vue/client'
import { useAction } from '../../vue/composables/use-action'
import { useMutation, type VueMutation } from '../../vue/composables/use-mutation'
import {
  usePaginatedQuery,
  type PaginatedQueryArgs,
  type UsePaginatedQueryReturnType,
} from '../../vue/composables/use-paginated-query'
import { useQuery } from '../../vue/composables/use-query'

export const DEFAULT_STORAGE_KEY = 'convex-session-id'

/**
 * Where the session ID is kept: a composable that returns a writable ref of
 * the stored value, as VueUse's `useLocalStorage` and `useSessionStorage` do.
 *
 * @public
 */
export type UseStorage<T> = (
  key: string,
  initialValue: T,
) => Ref<T>

export type RefreshSessionFn = (
  beforeUpdate?: (newSessionId: SessionId) => any | Promise<any>,
) => Promise<SessionId>

/** What {@link provideSession} provides. */
type SessionContextValue = {
  sessionId: ComputedRef<SessionId | undefined>
  refreshSessionId: RefreshSessionFn
  sessionIdPromise: ComputedRef<Promise<SessionId>>
  ssrFriendly?: boolean
}

/**
 * The injection key {@link provideSession} provides the session under: the
 * Vue counterpart of upstream's `SessionContext`.
 *
 * @public
 */
export const SessionKey: InjectionKey<SessionContextValue> = Symbol('convex-helpers:session')

type SessionFunction<T extends 'query' | 'mutation' | 'action', Args = any>
  = | FunctionReference<T, 'public', { sessionId: SessionId } & Args>
    | FunctionReference_future<T, 'public', { sessionId: SessionId } & Args>

type ArgsWithoutSession<
  Fn extends SessionFunction<'query' | 'mutation' | 'action'>,
> = BetterOmit<FunctionArgs<Fn>, 'sessionId'>

export type SessionQueryArgsArray<Fn extends SessionFunction<'query'>>
  = keyof FunctionArgs<Fn> extends 'sessionId'
    ? [args?: EmptyObject | 'skip']
    : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn>
      ? [args?: ArgsWithoutSession<Fn> | 'skip']
      : [args: ArgsWithoutSession<Fn> | 'skip']

export type SessionArgsArray<
  Fn extends SessionFunction<'query' | 'mutation' | 'action'>,
> = keyof FunctionArgs<Fn> extends 'sessionId'
  ? [args?: EmptyObject]
  : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn>
    ? [args?: ArgsWithoutSession<Fn>]
    : [args: ArgsWithoutSession<Fn>]

export type SessionArgsAndOptions<
  Fn extends SessionFunction<'mutation'>,
  Options,
> = keyof FunctionArgs<Fn> extends 'sessionId'
  ? [args?: EmptyObject, options?: Options]
  : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn>
    ? [args?: ArgsWithoutSession<Fn>, options?: Options]
    : [args: ArgsWithoutSession<Fn>, options?: Options]

type SessionPaginatedQueryFunction<
  Args extends { paginationOpts: PaginationOptions } = {
    paginationOpts: PaginationOptions
  },
> = FunctionReference<
  'query',
  'public',
  { sessionId: SessionId } & Args,
  PaginationResult<any>
>

export type SessionPaginatedQueryArgs<
  Fn extends SessionPaginatedQueryFunction,
> = BetterOmit<PaginatedQueryArgs<Fn>, 'sessionId'> | 'skip'

/** A composable's arguments, each as a value, a ref or a getter. */
type ReactiveArgs<T extends readonly unknown[]> = { [K in keyof T]: MaybeRefOrGetter<T[K]> }

/**
 * Options of {@link provideSession} and the props of `<SessionProvider>`.
 *
 * @public
 */
export type SessionProviderOptions = {
  useStorage?: UseStorage<SessionId | undefined>
  storageKey?: string
  idGenerator?: () => string
  ssrFriendly?: boolean
}

/**
 * Provide a Convex session to the component's descendants: a port of
 * upstream's `<SessionProvider>`, creating a server session and providing
 * the id.
 *
 * @param options.useStorage - Where you want your session ID to be persisted. Roughly:
 *  - sessionStorage is saved per-tab (default).
 *  - localStorage is shared between tabs, but not browser profiles.
 *  VueUse's `useLocalStorage` fits as it is.
 * @param options.storageKey - Key under which to store the session ID in the store
 * @param options.idGenerator - Function to return a new, unique session ID string.
 *   Defaults to crypto.randomUUID (which isn't always available for server SSR)
 * @param options.ssrFriendly - Set this if you're using SSR. Defaults to false.
 *   The sessionId won't be available on the server, so the server render and
 *   first client render will have undefined sessionId. During this render:
 *   1. {@link useSessionQuery} will wait for a valid ID via "skip".
 *   2. {@link useSessionMutation} and {@link useSessionAction} will wait for
 *      a valid ID via a promise if called from the first pass.
 *   3. {@link useSessionId} will return undefined for the sessionId along with
 *      the promise to await for the valid ID.
 * @public
 */
export function provideSession(options: SessionProviderOptions = {}): void {
  const { useStorage, storageKey, idGenerator, ssrFriendly } = options
  const storeKey = storageKey ?? DEFAULT_STORAGE_KEY
  function idGen() {
    // On the server, crypto may not be defined.
    return (idGenerator ?? crypto.randomUUID.bind(crypto))() as SessionId
  }
  const convex = useConvex()
  const initialValue = ssrFriendly
    ? undefined
    : convex instanceof ConvexVueSessionClient
      ? convex.getSessionId()
      : idGen()
  // Get or set the ID from our desired storage location.
  const useStorageOrDefault = useStorage ?? useSessionStorage
  const stored = useStorageOrDefault(storeKey, initialValue)
  const sessionId = computed(() => stored.value)
  const setSessionId = (value: SessionId) => {
    stored.value = value
  }

  let resolveSessionId: (value: SessionId) => void = () => {}
  const sessionIdPromise = computed(() => {
    if (sessionId.value) return Promise.resolve(sessionId.value)
    return new Promise<SessionId>((r) => {
      resolveSessionId = r
    })
  })

  const initial = ref(true)
  // Generate a new session ID on first load.
  // This is to get around SSR issues with localStorage.
  // PARITY: D-01
  // Upstream runs this in an effect, which React runs after the first render
  // and never on the server.
  onMounted(() => {
    // If we're not using our session storage, let's ensure they save it.
    if (useStorage && stored.value) setSessionId(stored.value)
    watch(sessionId, (id) => {
      if (!id) {
        // Read the promise first, so its resolver is the current one.
        void sessionIdPromise.value
        const newId = idGen()
        setSessionId(newId)
        if (convex instanceof ConvexVueSessionClient) {
          convex.setSessionId(newId)
        }
        resolveSessionId(newId)
      }
      if (ssrFriendly && initial.value) initial.value = false
    }, { immediate: true })
  })

  const refreshSessionId: RefreshSessionFn = async (beforeUpdate) => {
    const newSessionId = idGen()
    if (beforeUpdate) {
      await beforeUpdate(newSessionId)
    }
    setSessionId(newSessionId)
    return newSessionId
  }

  provide(SessionKey, {
    sessionId: computed(() => (ssrFriendly && initial.value ? undefined : sessionId.value)),
    refreshSessionId,
    sessionIdPromise,
    ssrFriendly,
  })
}

/**
 * A thin component over {@link provideSession}, for templates that mirror
 * upstream's `<SessionProvider>`.
 *
 * @public
 */
export const SessionProvider = defineComponent({
  name: 'SessionProvider',
  props: {
    useStorage: { type: Function as PropType<UseStorage<SessionId | undefined>>, default: undefined },
    storageKey: { type: String, default: undefined },
    idGenerator: { type: Function as PropType<() => string>, default: undefined },
    ssrFriendly: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    provideSession({
      useStorage: props.useStorage,
      storageKey: props.storageKey,
      idGenerator: props.idGenerator,
      ssrFriendly: props.ssrFriendly,
    })
    return () => slots.default?.()
  },
})

/**
 * Use this in place of `useQuery` to run a query, passing a sessionId.
 *
 * It automatically injects the sessionid parameter.
 * @param query Query that takes in a sessionId parameter. Like `api.foo.bar`.
 * @param args Args for that query, without the sessionId, as a value, a ref or a getter.
 * @returns A ref of the query result. For SSR, it will skip the query until the
 * client has mounted.
 * @public
 */
export function useSessionQuery<Query extends SessionFunction<'query'>>(
  query: Query,
  ...args: ReactiveArgs<SessionQueryArgsArray<Query>>
): ComputedRef<FunctionReturnType<Query> | undefined> {
  const [sessionId] = useSessionId()
  const argsObject = () => {
    const current = toValue(args[0]) as Record<string, unknown> | 'skip' | undefined
    return current === 'skip' || !sessionId.value
      ? ('skip' as const)
      : ({ ...current, sessionId: sessionId.value } as FunctionArgs<Query>)
  }
  return useQuery(query as FunctionReference<'query'>, argsObject) as ComputedRef<FunctionReturnType<Query> | undefined>
}

/**
 * Use this in place of `usePaginatedQuery` to run a query, passing a sessionId.
 *
 * @param query Query that takes in a sessionId parameter. Like `api.foo.bar`.
 * @param args Args for that query, without the sessionId, as a value, a ref or a getter.
 * @param options - An object specifying the `initialNumItems` to be loaded in
 * the first page.
 * @returns The refs of the currently loaded items and the status of the
 * pagination, and a `loadMore` function. For SSR, it will skip the query
 * until the client has mounted.
 * @public
 */
export function useSessionPaginatedQuery<
  Query extends SessionPaginatedQueryFunction,
>(
  query: Query,
  args: MaybeRefOrGetter<SessionPaginatedQueryArgs<Query>>,
  options: { initialNumItems: number },
): UsePaginatedQueryReturnType<Query> | undefined {
  const [sessionId] = useSessionId()
  const argsObject = () => {
    const current = toValue(args)
    return current === 'skip' || !sessionId.value
      ? ('skip' as const)
      : ({ ...current, sessionId: sessionId.value } as PaginatedQueryArgs<Query>)
  }

  return usePaginatedQuery(query, argsObject, options)
}

type SessionMutation<
  Mutation
  extends FunctionReference<'mutation'> | FunctionReference_future<'mutation'>,
> = (
  ...args: SessionArgsArray<Mutation>
) => Promise<FunctionReturnType<Mutation>>

// Similar to VueMutation, but with a sessionId parameter.
interface VueSessionMutation<
  Mutation
  extends FunctionReference<'mutation'> | FunctionReference_future<'mutation'>,
> extends SessionMutation<Mutation> {
  withOptimisticUpdate(
    optimisticUpdate: OptimisticUpdate<FunctionArgs<Mutation>>,
  ): SessionMutation<Mutation>
}

/**
 * Use this in place of `useMutation` to run a mutation with a sessionId.
 *
 * It automatically injects the sessionId parameter.
 * @param name Mutation that takes in a sessionId parameter. Like `api.foo.bar`.
 * @returns A mutation function. For SSR, it will wait until the client has a
 * valid sessionId.
 * @public
 */
export function useSessionMutation<
  Mutation extends SessionFunction<'mutation'>,
>(name: Mutation): VueSessionMutation<Mutation> {
  const [sessionId, _, sessionIdPromise] = useSessionId()
  const originalMutation = useMutation(name as FunctionReference<'mutation'>) as VueMutation<FunctionReference<'mutation'>>

  function createMutation(
    originalMutation: (args: any) => Promise<any>,
  ): SessionMutation<Mutation> {
    return async (...args) => {
      const argsObject = {
        ...args[0],
        sessionId: sessionId.value || (await sessionIdPromise.value),
      } as FunctionArgs<Mutation>
      return originalMutation(argsObject)
    }
  }
  const mutation = createMutation(
    originalMutation,
  ) as VueSessionMutation<Mutation>
  mutation.withOptimisticUpdate = (optimisticUpdate) => {
    return createMutation(
      originalMutation.withOptimisticUpdate(optimisticUpdate as OptimisticUpdate<any>),
    )
  }
  return mutation
}

/**
 * Use this in place of `useAction` to run an action with a sessionId.
 *
 * It automatically injects the sessionId parameter.
 * @param name Action that takes in a sessionId parameter. Like `api.foo.bar`.
 * @returns An action function. For SSR, it will wait until the client has a
 * valid sessionId.
 * @public
 */
export function useSessionAction<Action extends SessionFunction<'action'>>(
  name: Action,
) {
  const [sessionId, _, sessionIdPromise] = useSessionId()
  const originalAction = useAction(name as FunctionReference<'action'>)

  return async (
    ...args: SessionArgsArray<Action>
  ): Promise<FunctionReturnType<Action>> => {
    const argsObject = {
      ...args[0],
      sessionId: sessionId.value || (await sessionIdPromise.value),
    } as FunctionArgs<Action>

    return originalAction(argsObject)
  }
}

/**
 * Get the session context when nested under {@link provideSession}.
 *
 * @returns [sessionId, refresh, sessionIdPromise] where:
 * The `sessionId` ref will only hold `undefined` when using SSR with
 * `ssrFriendly`, until the client has mounted.
 * To use it in an async context at that time, you can await `sessionIdPromise.value`.
 * `refresh` will generate a new sessionId. Pass a function to it to run before
 * generating the new ID.
 * @public
 */
export function useSessionId(): readonly [
  ComputedRef<SessionId | undefined>,
  RefreshSessionFn,
  ComputedRef<Promise<SessionId>>,
] {
  const ctx = inject(SessionKey, null)
  if (ctx === null) {
    throw new Error('Missing a <SessionProvider> wrapping this code.')
  }
  if (!ctx.ssrFriendly && ctx.sessionId.value === undefined) {
    throw new Error('Session ID invalid. Clear your storage?')
  }
  return [ctx.sessionId, ctx.refreshSessionId, ctx.sessionIdPromise] as const
}

/**
 * Use this in place of args to a Convex query that also take a sessionId.
 * e.g.
 * ```ts
 * const myQuery = useQuery(api.foo.bar, useSessionIdArg({ arg: "baz" }));
 * ```
 * @param args Usually args to a Convex query that also take a sessionId, as a
 * value, a ref or a getter.
 * @returns A ref of the args with the sessionId, or "skip" during server &
 * first client render, if ssrFriendly is set.
 * @public
 */
export function useSessionIdArg<T>(args: MaybeRefOrGetter<T | 'skip'>) {
  const [sessionId] = useSessionId()
  return computed(() => {
    const current = toValue(args)
    return sessionId.value && current !== 'skip' ? { ...current, sessionId: sessionId.value } : 'skip'
  })
}

/**
 * Compare with `ref`, but also persists the value in sessionStorage.
 * @param key Key to use for sessionStorage.
 * @param initialValue If there is no value in storage, use this.
 * @returns A writable ref of the value.
 * @public
 */
export function useSessionStorage(
  key: string,
  initialValue: SessionId | undefined,
): Ref<SessionId | undefined> {
  const read = (): SessionId | undefined => {
    if (typeof sessionStorage !== 'undefined') {
      const existing = sessionStorage.getItem(key)
      if (existing) {
        if (existing === 'undefined') {
          return undefined
        }
        return existing as SessionId
      }
      if (initialValue !== undefined) sessionStorage.setItem(key, initialValue)
    }
    return initialValue
  }
  const value = ref(read())
  return computed({
    get: () => value.value,
    set: (next) => {
      sessionStorage.setItem(key, next!)
      value.value = next
    },
  })
}

/**
 * Simple storage interface that matches localStorage/sessionStorage.
 */
interface SessionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/**
 * A client wrapper that adds session data to Convex functions: a port of
 * upstream's `ConvexReactSessionClient`.
 *
 * Wraps a ConvexClient and provides methods to automatically inject
 * the sessionId parameter into queries, mutations, and actions.
 *
 * Example:
 * ```ts
 * const sessionClient = new ConvexVueSessionClient(address);
 *
 * // Use sessionClient instead of client
 * const result = await sessionClient.sessionQuery(
 *   api.myModule.myQuery,
 *   { arg1: 123 },
 * );
 * ```
 * @public
 */
export class ConvexVueSessionClient extends ConvexVueClient {
  private sessionId: SessionId
  private storageKey: string
  private storage: SessionStorage | null

  /**
   * Create a new ConvexVueSessionClient.
   *
   * @param address The deployment URL
   * @param options Optional configuration
   * @param options.sessionId Initial session ID (will generate one if not provided)
   * @param options.storage Storage interface to use (defaults to sessionStorage if available)
   * @param options.storageKey Key to use for storage (defaults to "convex-session-id")
   */
  constructor(
    address: string,
    options?: ConvexVueClientOptions & {
      sessionId?: SessionId
      storage?: SessionStorage
      storageKey?: string
    },
  ) {
    super(address, options)
    this.storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY

    this.storage
      = options?.storage
        || (typeof sessionStorage !== 'undefined' ? sessionStorage : null)

    if (options?.sessionId) {
      this.sessionId = options.sessionId
    }
    else {
      let storedId: SessionId | undefined
      if (this.storage) {
        const stored = this.storage.getItem(this.storageKey)
        if (stored && stored !== 'undefined') {
          storedId = stored as SessionId
        }
      }
      if (storedId) {
        this.sessionId = storedId
      }
      else {
        if (typeof crypto === 'undefined') {
          throw new Error(
            'Crypto is not available. If you\'re in a server environment, you must provide a sessionId manually.',
          )
        }
        // We have to explicitly set it here so TypeScript won't complain about it being uninitialized.
        this.sessionId = crypto.randomUUID() as SessionId
        this.setSessionId(this.sessionId)
      }
    }
  }

  /**
   * Set a new session ID to use for future function calls.
   *
   * NOTE: Setting it here will not propagate to any SessionProvider.
   * So if you plan to change the sessionId and you are using a SessionProvider,
   * you should update it there instead.
   *
   * @param sessionId The new session ID
   */
  setSessionId(sessionId: SessionId): void {
    this.sessionId = sessionId
    if (this.storage) {
      this.storage.setItem(this.storageKey, sessionId)
    }
  }

  /**
   * Get the current session ID.
   *
   * @returns The current session ID
   */
  getSessionId(): SessionId {
    return this.sessionId
  }

  /**
   * Run a Convex query with the session ID injected.
   *
   * @param query Query that takes a sessionId parameter
   * @param args Arguments for the query, without the sessionId
   * @returns A promise of the query result
   */
  sessionQuery<Query extends SessionFunction<'query'>>(
    query: Query,
    ...args: SessionArgsArray<Query>
  ): Promise<FunctionReturnType<Query>> {
    return this.query(query as FunctionReference<'query'>, {
      ...args[0],
      sessionId: this.sessionId,
    } as FunctionArgs<Query>)
  }

  /**
   * Run a Convex mutation with the session ID injected.
   *
   * @param mutation Mutation that takes a sessionId parameter
   * @param args Arguments for the mutation, without the sessionId
   * @returns A promise of the mutation result
   */
  sessionMutation<Mutation extends SessionFunction<'mutation'>>(
    mutation: Mutation,
    ...args: SessionArgsAndOptions<
      Mutation,
      MutationOptions<FunctionArgs<Mutation>>
    >
  ): Promise<FunctionReturnType<Mutation>> {
    return this.mutation(
      mutation as FunctionReference<'mutation'>,
      {
        ...args[0],
        sessionId: this.sessionId,
      } as FunctionArgs<Mutation>,
      args[1] as MutationOptions<any>,
    )
  }

  /**
   * Run a Convex action with the session ID injected.
   *
   * @param action Action that takes a sessionId parameter
   * @param args Arguments for the action, without the sessionId
   * @returns A promise of the action result
   */
  sessionAction<Action extends SessionFunction<'action'>>(
    action: Action,
    ...args: SessionArgsArray<Action>
  ): Promise<FunctionReturnType<Action>> {
    return this.action(action as FunctionReference<'action'>, {
      ...args[0],
      sessionId: this.sessionId,
    } as FunctionArgs<Action>)
  }
}
