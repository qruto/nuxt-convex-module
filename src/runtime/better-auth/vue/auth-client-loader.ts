// PARITY: D-18
// The Better Auth client, created on first use. Upstream's provider takes a
// client the app built at import, so every page carries it; here the runtime
// reaches `#convex/auth-client` only through the dynamic import below, and a
// page that never needs the client never downloads it. The module behind the
// alias is still one module: whoever imports it, statically or through here,
// gets the same instance.
import { getCurrentScope, shallowRef, watch, type Ref } from 'vue'
import type { AuthClient } from '#convex/auth-client'

let loaded: AuthClient | undefined
let loading: Promise<AuthClient> | undefined
let deferred = false
const waiting = new Set<(client: AuthClient) => void>()

/**
 * The app's Better Auth client (`#convex/auth-client`), loading it on the
 * first call. Every call resolves to the same instance, the one a static
 * `import { authClient } from 'nuxt-convex-module/better-auth/client'` holds.
 *
 * @example
 * ```ts
 * async function signOut() {
 *   const client = await loadAuthClient()
 *   await client.signOut()
 * }
 * ```
 *
 * @public
 */
export function loadAuthClient(): Promise<AuthClient> {
  loading ??= import('#convex/auth-client').then(
    ({ authClient }) => {
      registerAuthClient(authClient)
      return authClient
    },
    (error: unknown) => {
      // A chunk that failed to load is asked for again on the next call.
      loading = undefined
      throw error
    },
  )
  return loading
}

/**
 * Hand the loader a client module that has evaluated: through
 * {@link loadAuthClient}, or a static import of it, which the module's build
 * step makes call this (`registerAuthClientOnEvaluation` in `src/module.ts`).
 * Either way every listener hears of it once; one that throws is reported and
 * the rest still run. @internal
 */
export function registerAuthClient(client: AuthClient): void {
  if (loaded) return
  loaded = client
  loading ??= Promise.resolve(client)
  const listeners = [...waiting]
  waiting.clear()
  for (const listener of listeners) {
    try {
      listener(client)
    }
    catch (error) {
      report(error)
    }
  }
}

/** An error a listener threw, surfaced without stopping the others. */
function report(error: unknown): void {
  if (typeof globalThis.reportError === 'function') globalThis.reportError(error)
  else queueMicrotask(() => {
    throw error
  })
}

/** The client once {@link loadAuthClient} has it, else `undefined`. @internal */
export function loadedAuthClient(): AuthClient | undefined {
  return loaded
}

/** Run `listener` with the client: now when it is loaded, else when it arrives. @internal */
export function onAuthClient(listener: (client: AuthClient) => void): void {
  if (loaded) listener(loaded)
  else waiting.add(listener)
}

/**
 * Hold the load back until something needs the client: the server found no
 * session on this request. A tab that comes back into view loads it, as
 * Better Auth refetches the session then; so does every
 * {@link loadAuthClient} call. @internal
 */
export function deferAuthClient(): void {
  if (deferred || loaded) return
  deferred = true
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return
    // Kept until a load succeeds: a failed one is tried again next time.
    void loadAuthClient().then(() => document.removeEventListener('visibilitychange', onVisible), () => {})
  }
  document.addEventListener('visibilitychange', onVisible)
}

/** Whether the load waits for a first use (see {@link deferAuthClient}). @internal */
export function isAuthClientDeferred(): boolean {
  return deferred && !loaded
}

/** The member at `path` on `client`, and the object it was read from. */
function reach(client: AuthClient, path: readonly PropertyKey[]): { owner: unknown, value: unknown } {
  let owner: unknown
  let value: unknown = client
  for (const key of path) {
    owner = value
    value = (value as Record<PropertyKey, unknown>)[key]
  }
  return { owner, value }
}

function call(client: AuthClient, path: readonly PropertyKey[], args: unknown[]): unknown {
  const { owner, value } = reach(client, path)
  return Reflect.apply(value as (...args: unknown[]) => unknown, owner, args)
}

// Better Auth's Vue hooks (`useSession`, a plugin's `useActiveOrganization`)
// answer at once with a ref of `{ data, error, isPending, … }`.
const HOOK = /^use[A-Z]/

/**
 * A store subscription (`$store.atoms.session.subscribe(fn)`, nanostores'
 * `listen`) made before the client is here: it starts once the client
 * loads, and the unsubscribe it answers with at once cancels it either way.
 */
function pendingSubscription(path: readonly PropertyKey[], args: unknown[]): () => void {
  let unsubscribe: (() => void) | undefined
  let cancelled = false
  void loadAuthClient().then((client) => {
    if (!cancelled) unsubscribe = call(client, path, args) as () => void
  }, () => {})
  return () => {
    cancelled = true
    unsubscribe?.()
  }
}

/**
 * A hook called before the client is here: a ref that reads pending, as
 * Better Auth's own store reads before its first fetch, and follows the real
 * hook once the client loads, subscribed in the caller's scope as the real
 * hook would have been. The call loads the client.
 */
function pendingHook(path: readonly PropertyKey[], args: unknown[]): Ref<unknown> {
  const scope = getCurrentScope()
  const refetch = async (...refetchArgs: unknown[]): Promise<unknown> => {
    await loadAuthClient()
    const next = state.value.refetch as (...a: unknown[]) => unknown
    // Still this one: the hook never followed (its scope had ended).
    if (next === refetch) return
    return next(...refetchArgs)
  }
  const state: Ref<Record<string, unknown>> = shallowRef({
    data: null,
    error: null,
    isPending: true,
    isRefetching: false,
    refetch,
  })
  // Better Auth's stores never fetch on the server, and a server render's
  // scope is never disposed: answer pending, and follow nothing.
  if (import.meta.server) return state
  onAuthClient((client) => {
    const follow = () => watch(call(client, path, args) as Ref<Record<string, unknown>>, (value) => {
      state.value = value
    }, { immediate: true, flush: 'sync' })
    if (!scope) follow()
    else if (scope.active) scope.run(follow)
  })
  void loadAuthClient().catch(() => {})
  return state
}

// A path through the client that resolves when it is used: read once the
// client is loaded, the real member; called before, a hook's pending ref or
// a promise of the call.
function lazyPath(path: readonly PropertyKey[]): unknown {
  return new Proxy(() => {}, {
    get(_target, key) {
      if (loaded) return (reach(loaded, path).value as Record<PropertyKey, unknown>)[key]
      // Not a thenable: `await client` must not wait on a call to `then`.
      if (key === 'then') return undefined
      return lazyPath([...path, key])
    },
    apply(_target, _this, args: unknown[]) {
      if (loaded) return call(loaded, path, args)
      const name = path.at(-1)
      // `useSession(useFetch)`, Better Auth's Nuxt form, answers with a
      // promise: a call, not a hook.
      if (typeof name === 'string' && HOOK.test(name) && typeof args[0] !== 'function') return pendingHook(path, args)
      if (name === 'subscribe' || name === 'listen') return pendingSubscription(path, args)
      return loadAuthClient().then(client => call(client, path, args))
    },
  })
}

/**
 * The client as `useBetterAuth().client` hands it out before it has loaded.
 * A call through it (`client.signIn.email(...)`, `client.signOut()`) loads
 * the client and resolves with the call's result; a hook
 * (`client.useActiveOrganization()`) answers at once with a pending ref that
 * follows the real one. Once loaded, every member reads as the client's own.
 * @internal
 */
export const lazyAuthClient = lazyPath([]) as AuthClient

/** Forget the deferral between tests. The loaded client is the module's, and stays. @internal */
export function __resetAuthClientLoaderForTests(): void {
  deferred = false
  waiting.clear()
}
