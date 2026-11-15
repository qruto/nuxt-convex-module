// PARITY: A-19
import { AuthClient } from '@convex-dev/auth/browser'
import { getFunctionName, makeFunctionReference } from 'convex/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, inject } from 'vue'
import { silentConnectLogger } from '../../helpers/silent-logger'

// The cookie-session plugin, driven with a stubbed `#app` (the pattern from
// auth/vue/plugin-client.test.ts). It stands in for upstream's
// `<ConvexAuthNextjsProvider>`: an `AuthClient` in SSR mode that signs in,
// refreshes and signs out through the module's routes, provided app-wide.

const states = new Map<string, { value: unknown }>()
vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: { setup: unknown }) => plugin.setup,
  useState: (key: string, init?: () => unknown) => {
    if (!states.has(key)) states.set(key, { value: init?.() ?? null })
    return states.get(key)
  },
  useRequestEvent: () => undefined,
  useResponseHeader: () => ({ value: undefined }),
}))

const useSessionWatcher = vi.fn()
vi.mock('../../../src/runtime/convex-auth/vue/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/runtime/convex-auth/vue/client')>()
  return { ...actual, useSessionWatcher: (...args: unknown[]) => useSessionWatcher(...args) }
})

const { useAuthSignInApi } = await import('../../../src/runtime/convex-auth/vue/client')
const { useAuthActions, useAuthToken } = await import('../../../src/runtime/convex-auth/vue/index')
const { ConvexAuthStateKey, useConvexAuth } = await import('../../../src/runtime/vue/auth/index')
const { ConvexClientKey, ConvexVueClient } = await import('../../../src/runtime/vue/client')
const plugin = (await import('../../../src/runtime/convex-auth/nuxt/plugin')).default as unknown as (nuxtApp: unknown) => void

const URL = 'https://happy-animal-123.convex.cloud'

/** An unsigned JWT that expires in ten minutes. */
const TOKEN = (() => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'RS256' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 600, sub: 'user-1' })}.signature`
})()

function run({ token = null as string | null, name = 'auth:isAuthenticated' as string | null, client = true, hydrating = true } = {}) {
  states.set('convex:initialToken', { value: token })
  states.set('convex:auth:isAuthenticated', { value: name })
  const vueApp = createApp({ render: () => null })
  if (client) vueApp.provide(ConvexClientKey, new ConvexVueClient(URL, { logger: silentConnectLogger }))
  const hooks = new Map<string, Set<() => void>>()
  const nuxtApp = {
    vueApp,
    isHydrating: hydrating,
    hook: (hook: string, fn: () => void) => {
      if (!hooks.has(hook)) hooks.set(hook, new Set())
      hooks.get(hook)!.add(fn)
      return () => hooks.get(hook)!.delete(fn)
    },
  }
  vueApp.runWithContext(() => plugin(nuxtApp))
  return {
    /** Run a composable as a component anywhere in the app would. */
    use: <T>(composable: () => T) => vueApp.runWithContext(composable),
    call: (hook: string) => [...(hooks.get(hook) ?? [])].forEach(fn => fn()),
  }
}

/** A `fetch` that answers every request with `body`, and records the calls. */
function stubFetch(body: unknown) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  states.clear()
})

describe('convex-auth cookie-session plugin', () => {
  it('provides the actions, the sign-in api, the token and the auth state to the whole app', () => {
    const { use } = run()
    expect(use(() => useAuthActions())).toEqual({ setSession: expect.any(Function), signOut: expect.any(Function) })
    expect(use(() => useAuthSignInApi())).toBeDefined()
    expect(use(() => useAuthToken()).value).toBeNull()
    expect(use(() => useConvexAuth()).isLoading.value).toBe(true)
  })

  // A page with an async `setup` hydrates when the root Suspense resolves,
  // after `app:mounted`. A session loaded before that renders a signed-in page
  // over the server's loading one.
  it('loads the session when the root Suspense resolves, once', () => {
    stubFetch({ tokens: null })
    const init = vi.spyOn(AuthClient.prototype, 'init')
    const { call } = run()

    call('app:mounted')
    expect(init).not.toHaveBeenCalled()

    call('app:suspense:resolve')
    expect(init).toHaveBeenCalledTimes(1)

    // The hook fires again on each navigation.
    call('app:suspense:resolve')
    expect(init).toHaveBeenCalledTimes(1)
  })

  // Nothing to hydrate, and the route middleware waits for the session.
  it('loads the session at once on a page the server did not render', () => {
    stubFetch({ tokens: null })
    const init = vi.spyOn(AuthClient.prototype, 'init')
    run({ hydrating: false })
    expect(init).toHaveBeenCalledTimes(1)
  })

  it('adopts the token the server put in the payload', async () => {
    const { use, call } = run({ token: TOKEN })
    const token = use(() => useAuthToken())
    expect(token.value).toBeNull()

    call('app:suspense:resolve')
    await vi.waitFor(() => expect(token.value).toBe(TOKEN))
  })

  it('signs in through the auth route, not the deployment', async () => {
    const fetch = stubFetch({ status: 'success', value: { status: 'error', userError: { error: 'INVALID_CREDENTIALS' } } })
    const { use } = run()
    const signIn = makeFunctionReference<'mutation'>('auth:signInWithUsernamePassword') as never

    const result = await use(() => useAuthSignInApi()).mutation(signIn, { username: 'alice' } as never)

    expect(result).toEqual({ status: 'error', userError: { error: 'INVALID_CREDENTIALS' } })
    expect(fetch.mock.calls[0]![0]).toBe('/api/_convex/auth/signin?path=/api/mutation')
  })

  it('signs out through the auth route', async () => {
    const fetch = stubFetch({ tokens: null })
    const { use, call } = run({ token: TOKEN })
    call('app:suspense:resolve')
    await vi.waitFor(() => expect(use(() => useAuthToken()).value).toBe(TOKEN))

    await use(() => useAuthActions()).signOut()

    expect(fetch).toHaveBeenCalledWith('/api/_convex/auth/signout', expect.objectContaining({ method: 'POST' }))
    expect(use(() => useAuthToken()).value).toBeNull()
  })

  it('watches the session through the query the payload names', () => {
    const { use } = run({ name: 'users:isSignedIn' })
    expect(useSessionWatcher).toHaveBeenCalledTimes(1)
    const [authClient, reference, state] = useSessionWatcher.mock.calls[0]!
    expect(authClient).toBeInstanceOf(AuthClient)
    expect(getFunctionName(reference)).toBe('users:isSignedIn')
    expect(state).toBe(use(() => useConvexAuth()))
  })

  // A page the server did not render has no payload.
  it('starts no watcher without the query\'s name', () => {
    run({ name: null })
    expect(useSessionWatcher).not.toHaveBeenCalled()
  })

  it('does nothing without a Convex client', () => {
    const { use } = run({ client: false })
    expect(use(() => inject(ConvexAuthStateKey, null))).toBeNull()
  })
})
