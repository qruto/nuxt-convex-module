// PARITY: D-18
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

// The runtime reaches `#convex/auth-client` only through `loadAuthClient()`:
// one instance, loaded once, asked for again after a failed load, and a
// forwarding client whose calls wait for it.

const signOut = vi.fn(async (options?: unknown) => ({ data: { success: true }, options }))
const fakeClient = {
  signOut,
  signIn: { email: vi.fn(async (args: { email: string }) => ({ data: { user: { email: args.email } } })) },
  $store: { name: 'store', atoms: { session: { subscribe: vi.fn((_listener: unknown) => unsubscribeAtom) } } },
  convex: { token: vi.fn(async () => ({ data: { token: 'jwt-after-sign-in' }, error: null })) },
  useSession: (useFetch?: unknown) => typeof useFetch === 'function' ? Promise.resolve({ data: 'fetched' }) : sessionRef,
  useActiveOrganization: vi.fn((..._args: unknown[]) => organizationRef),
}
const unsubscribeAtom = vi.fn()
const organizationRef = ref<{ data: unknown, isPending: boolean }>({ data: null, isPending: true })
const sessionRef = ref<{ data: unknown, isPending: boolean }>({ data: null, isPending: true })
vi.mock('#convex/auth-client', () => ({ authClient: fakeClient }))

// A fresh loader each time: nothing loaded, nothing deferred.
async function loader() {
  vi.resetModules()
  return import('../../../../src/runtime/better-auth/vue/auth-client-loader')
}

describe('loadAuthClient', () => {
  beforeEach(() => {
    signOut.mockClear()
  })

  it('loads the aliased client once, whoever asks and however often', async () => {
    const { loadAuthClient, loadedAuthClient } = await loader()
    expect(loadedAuthClient()).toBeUndefined()

    const [first, second] = await Promise.all([loadAuthClient(), loadAuthClient()])
    expect(first).toBe(fakeClient)
    expect(second).toBe(fakeClient)
    expect(await loadAuthClient()).toBe(fakeClient)
    expect(loadedAuthClient()).toBe(fakeClient)
  })

  it('asks for the chunk again after a failed load', async () => {
    let failures = 1
    vi.doMock('#convex/auth-client', () => {
      if (failures-- > 0) throw new Error('chunk failed')
      return { authClient: fakeClient }
    })
    try {
      const { loadAuthClient } = await loader()
      // Vitest wraps a factory's throw in its own message; any rejection will do.
      await expect(loadAuthClient()).rejects.toThrow()
      vi.resetModules()
      expect(await loadAuthClient()).toBe(fakeClient)
    }
    finally {
      vi.doMock('#convex/auth-client', () => ({ authClient: fakeClient }))
    }
  })

  it('tells every waiting listener once the client arrives, and a later one at once', async () => {
    const { loadAuthClient, onAuthClient } = await loader()
    const early = vi.fn()
    onAuthClient(early)
    expect(early).not.toHaveBeenCalled()

    await loadAuthClient()
    expect(early).toHaveBeenCalledWith(fakeClient)

    const late = vi.fn()
    onAuthClient(late)
    expect(late).toHaveBeenCalledWith(fakeClient)
    expect(early).toHaveBeenCalledTimes(1)
  })

  it('tells every listener when one throws, and stays loaded', async () => {
    const { loadAuthClient, loadedAuthClient, onAuthClient } = await loader()
    const reportError = vi.fn()
    vi.stubGlobal('reportError', reportError)
    try {
      const broken = new Error('listener broke')
      onAuthClient(() => {
        throw broken
      })
      const after = vi.fn()
      onAuthClient(after)

      await expect(loadAuthClient()).resolves.toBe(fakeClient)
      expect(after).toHaveBeenCalledWith(fakeClient)
      expect(reportError).toHaveBeenCalledWith(broken)
      expect(loadedAuthClient()).toBe(fakeClient)
      await expect(loadAuthClient()).resolves.toBe(fakeClient)
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('takes a client a static import evaluated, and tells the listeners', async () => {
    const { loadAuthClient, loadedAuthClient, onAuthClient, registerAuthClient } = await loader()
    const listener = vi.fn()
    onAuthClient(listener)

    registerAuthClient(fakeClient as never)
    expect(loadedAuthClient()).toBe(fakeClient)
    expect(listener).toHaveBeenCalledWith(fakeClient)
    await expect(loadAuthClient()).resolves.toBe(fakeClient)
    registerAuthClient({} as never)
    expect(loadedAuthClient()).toBe(fakeClient)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('lazyAuthClient', () => {
  it('loads the client on a call made before it is here, and resolves with the call', async () => {
    const { lazyAuthClient, loadedAuthClient } = await loader()
    const client = lazyAuthClient as unknown as typeof fakeClient

    // A member taken off before the load keeps working after it.
    const email = client.signIn.email
    const answer = await email({ email: 'ada@example.com' })

    expect(answer).toEqual({ data: { user: { email: 'ada@example.com' } } })
    expect(fakeClient.signIn.email).toHaveBeenCalledWith({ email: 'ada@example.com' })
    expect(loadedAuthClient()).toBe(fakeClient)
  })

  it('reads every member as the client\'s own once loaded', async () => {
    const { lazyAuthClient, loadAuthClient } = await loader()
    await loadAuthClient()
    const client = lazyAuthClient as unknown as typeof fakeClient

    expect(client.$store).toBe(fakeClient.$store)
    expect(client.signIn).toBe(fakeClient.signIn)
    await expect(client.signOut({ fetchOptions: {} })).resolves.toMatchObject({ data: { success: true } })
    expect(signOut).toHaveBeenCalledWith({ fetchOptions: {} })
  })

  it('answers a hook called before the load at once, then follows the real one in the caller\'s scope', async () => {
    const { lazyAuthClient, loadedAuthClient } = await loader()
    const client = lazyAuthClient as unknown as typeof fakeClient
    const scope = effectScope()

    const organization = scope.run(() => client.useActiveOrganization('team'))!
    expect(organization.value).toMatchObject({ data: null, isPending: true })

    await vi.waitFor(() => expect(loadedAuthClient()).toBe(fakeClient))
    expect(fakeClient.useActiveOrganization).toHaveBeenCalledWith('team')
    organizationRef.value = { data: { id: 'org-1' }, isPending: false }
    expect(organization.value).toBe(organizationRef.value)

    // Stopped with the caller's scope, as the real hook's subscription is.
    scope.stop()
    organizationRef.value = { data: { id: 'org-2' }, isPending: false }
    expect(organization.value).toMatchObject({ data: { id: 'org-1' } })
  })

  it('answers useSession(useFetch) with a promise, as Better Auth does, not a pending ref', async () => {
    const { lazyAuthClient } = await loader()
    const client = lazyAuthClient as unknown as { useSession: (useFetch: unknown) => Promise<unknown> }
    await expect(client.useSession(() => {})).resolves.toEqual({ data: 'fetched' })
  })

  it('returns from a refetch whose hook never followed, instead of calling itself', async () => {
    const { lazyAuthClient, loadAuthClient } = await loader()
    const client = lazyAuthClient as unknown as typeof fakeClient
    const scope = effectScope()
    const organization = scope.run(() => client.useActiveOrganization()) as unknown as { value: { refetch: () => Promise<unknown> } }
    // The caller's scope ended before the client arrived: nothing follows.
    scope.stop()
    await loadAuthClient()

    await expect(organization.value.refetch()).resolves.toBeUndefined()
  })

  it('answers a store subscription made before the load with an unsubscribe that works at once', async () => {
    const { lazyAuthClient, loadAuthClient } = await loader()
    const client = lazyAuthClient as unknown as typeof fakeClient
    const subscribe = fakeClient.$store.atoms.session.subscribe
    subscribe.mockClear()
    unsubscribeAtom.mockClear()

    // Cancelled before the client arrived: it never subscribes.
    const cancelled = client.$store.atoms.session.subscribe(() => {}) as unknown as () => void
    expect(typeof cancelled).toBe('function')
    cancelled()
    // Kept: it subscribes once the client is here, and unsubscribes after.
    const kept = client.$store.atoms.session.subscribe(() => {}) as unknown as () => void
    await loadAuthClient()
    await Promise.resolve()
    expect(subscribe).toHaveBeenCalledTimes(1)
    kept()
    expect(unsubscribeAtom).toHaveBeenCalledTimes(1)
  })

  it('calls a method read off the loaded client with the client as this', async () => {
    const receivers: unknown[] = []
    const keyed = { action(this: unknown) {
      receivers.push(this)
      return 'ok'
    } }
    vi.doMock('#convex/auth-client', () => ({ authClient: keyed }))
    try {
      vi.resetModules()
      const fresh = await import('../../../../src/runtime/better-auth/vue/auth-client-loader')
      const client = fresh.lazyAuthClient as unknown as typeof keyed
      await fresh.loadAuthClient()
      expect(client.action()).toBe('ok')
      expect(receivers).toEqual([keyed])
    }
    finally {
      vi.doMock('#convex/auth-client', () => ({ authClient: fakeClient }))
    }
  })

  it('keeps a store subscription made before the load through a failed load', async () => {
    let failures = 1
    vi.doMock('#convex/auth-client', () => {
      if (failures-- > 0) throw new Error('chunk failed')
      return { authClient: fakeClient }
    })
    try {
      const { lazyAuthClient, loadAuthClient } = await loader()
      const subscribe = fakeClient.$store.atoms.session.subscribe
      subscribe.mockClear()
      const client = lazyAuthClient as unknown as typeof fakeClient
      client.$store.atoms.session.subscribe(() => {})
      await vi.waitFor(() => expect(failures).toBe(0))
      await Promise.resolve()
      expect(subscribe).not.toHaveBeenCalled()

      vi.resetModules()
      await loadAuthClient()
      expect(subscribe).toHaveBeenCalledTimes(1)
    }
    finally {
      vi.doMock('#convex/auth-client', () => ({ authClient: fakeClient }))
    }
  })

  it('answers a hook with the error when its load fails twice, and stops waiting when its scope ends', async () => {
    vi.doMock('#convex/auth-client', () => {
      throw new Error('chunk failed')
    })
    try {
      const { lazyAuthClient, registerAuthClient } = await loader()
      const client = lazyAuthClient as unknown as typeof fakeClient
      fakeClient.useActiveOrganization.mockClear()
      const scope = effectScope()
      const organization = scope.run(() => client.useActiveOrganization()) as unknown as { value: { isPending: boolean, error: unknown } }

      await vi.waitFor(() => expect(organization.value.isPending).toBe(false))
      expect(organization.value.error).toBeInstanceOf(Error)

      // Unmounted before the client came: nothing of it is left waiting.
      scope.stop()
      registerAuthClient(fakeClient as never)
      expect(fakeClient.useActiveOrganization).not.toHaveBeenCalled()
    }
    finally {
      vi.doMock('#convex/auth-client', () => ({ authClient: fakeClient }))
    }
  })

  it('is not a thenable, so awaiting it loads nothing', async () => {
    const { lazyAuthClient, loadedAuthClient } = await loader()
    expect(await lazyAuthClient).toBe(lazyAuthClient)
    expect(loadedAuthClient()).toBeUndefined()
  })
})

describe('deferAuthClient', () => {
  let visibility: DocumentVisibilityState
  let listeners: Array<() => void>

  beforeEach(() => {
    visibility = 'hidden'
    listeners = []
    vi.stubGlobal('document', {
      get visibilityState() {
        return visibility
      },
      addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
      removeEventListener: (_type: string, listener: () => void) => {
        listeners = listeners.filter(other => other !== listener)
      },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('holds the load until the tab comes back into view', async () => {
    const { deferAuthClient, isAuthClientDeferred, loadedAuthClient } = await loader()
    deferAuthClient()
    expect(isAuthClientDeferred()).toBe(true)

    listeners.forEach(listener => listener())
    await Promise.resolve()
    expect(loadedAuthClient()).toBeUndefined()

    visibility = 'visible'
    listeners.forEach(listener => listener())
    await vi.waitFor(() => expect(loadedAuthClient()).toBe(fakeClient))
    expect(isAuthClientDeferred()).toBe(false)
    expect(listeners).toEqual([])
  })

  it('tries again on the next visit to the tab after a failed load', async () => {
    let failures = 1
    vi.doMock('#convex/auth-client', () => {
      if (failures-- > 0) throw new Error('chunk failed')
      return { authClient: fakeClient }
    })
    try {
      const { deferAuthClient, loadedAuthClient } = await loader()
      deferAuthClient()
      visibility = 'visible'
      listeners.forEach(listener => listener())
      await vi.waitFor(() => expect(failures).toBe(0))
      await Promise.resolve()
      expect(loadedAuthClient()).toBeUndefined()
      expect(listeners).toHaveLength(1)

      vi.resetModules()
      listeners.forEach(listener => listener())
      await vi.waitFor(() => expect(loadedAuthClient()).toBe(fakeClient))
      await vi.waitFor(() => expect(listeners).toEqual([]))
    }
    finally {
      vi.doMock('#convex/auth-client', () => ({ authClient: fakeClient }))
    }
  })

  // A `<NuxtLink>` prefetching a page that imports `authClient` statically
  // runs the client module. That must not opt the visitor in.
  it('keeps a client module that ran during the deferral unused, until Better Auth signals a session change', async () => {
    const { deferAuthClient, loadedAuthClient, onAuthClient, registerEvaluatedAuthClient } = await loader()
    let signalled: (() => void) | undefined
    const stop = vi.fn()
    const ran = { $store: { atoms: { $sessionSignal: { listen: (listener: () => void) => {
      signalled = listener
      return stop
    } } } } }
    const listener = vi.fn()
    onAuthClient(listener)
    deferAuthClient()

    registerEvaluatedAuthClient(ran as never)
    expect(loadedAuthClient()).toBeUndefined()
    expect(listener).not.toHaveBeenCalled()

    // A sign-in through the static import.
    signalled!()
    expect(loadedAuthClient()).toBe(ran)
    expect(listener).toHaveBeenCalledWith(ran)
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('uses a client module that ran during the deferral on the first loadAuthClient()', async () => {
    const { deferAuthClient, loadAuthClient, loadedAuthClient, registerEvaluatedAuthClient } = await loader()
    deferAuthClient()
    const ran = { $store: { atoms: {} } }
    registerEvaluatedAuthClient(ran as never)

    await expect(loadAuthClient()).resolves.toBe(ran)
    expect(loadedAuthClient()).toBe(ran)
  })

  it('counts a client module that ran with nothing deferred as loaded at once', async () => {
    const { loadedAuthClient, registerEvaluatedAuthClient } = await loader()
    registerEvaluatedAuthClient(fakeClient as never)
    expect(loadedAuthClient()).toBe(fakeClient)
  })

  it('reads as not deferred once a first use loaded the client', async () => {
    const { deferAuthClient, isAuthClientDeferred, loadAuthClient } = await loader()
    deferAuthClient()
    await loadAuthClient()
    expect(isAuthClientDeferred()).toBe(false)
  })
})

describe('a session that waits for the client', () => {
  beforeEach(() => {
    sessionRef.value = { data: null, isPending: true }
    vi.stubGlobal('document', { visibilityState: 'hidden', addEventListener: () => {}, removeEventListener: () => {} })
  })

  afterEach(() => vi.unstubAllGlobals())

  async function deferred() {
    const { deferAuthClient, loadAuthClient, loadedAuthClient } = await loader()
    deferAuthClient()
    const auth = await import('../../../../src/runtime/better-auth/vue/use-better-auth')
    return { ...auth, loadAuthClient, loadedAuthClient }
  }

  it('reads pending without loading the client, then settles signed out after hydration', async () => {
    const { useBetterAuth, settleSessionWithoutClient, loadedAuthClient } = await deferred()
    const { session, isLoading, isAuthenticated } = useBetterAuth()

    expect(session.value.isPending).toBe(true)
    expect(isLoading.value).toBe(true)

    settleSessionWithoutClient()
    expect(session.value).toMatchObject({ data: null, isPending: false })
    expect(isLoading.value).toBe(false)
    expect(isAuthenticated.value).toBe(false)
    expect(loadedAuthClient()).toBeUndefined()
  })

  it('follows the client\'s session once a first use loads it', async () => {
    const { useBetterAuth, settleSessionWithoutClient, loadedAuthClient } = await deferred()
    const { session, isAuthenticated, client } = useBetterAuth()
    settleSessionWithoutClient()
    expect(loadedAuthClient()).toBeUndefined()

    await (client as unknown as typeof fakeClient).signOut()
    expect(loadedAuthClient()).toBe(fakeClient)

    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }
    expect(session.value).toBe(sessionRef.value)
    expect(isAuthenticated.value).toBe(true)
    // A client that is here leaves the session alone.
    settleSessionWithoutClient()
    expect(session.value).toBe(sessionRef.value)
  })

  it('keeps a settled session settled while the client\'s store reads pending, then follows its answer', async () => {
    const { useBetterAuth, settleSessionWithoutClient, loadAuthClient } = await deferred()
    const { session, isLoading } = useBetterAuth()
    settleSessionWithoutClient()
    expect(isLoading.value).toBe(false)

    // Better Auth's store before its first fetch: pending.
    const refetch = vi.fn(async () => {})
    sessionRef.value = { data: null, isPending: true, refetch } as never
    await loadAuthClient()
    expect(session.value.isPending).toBe(false)
    expect(isLoading.value).toBe(false)
    expect(session.value.refetch).toBe(refetch)

    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }
    expect(session.value).toBe(sessionRef.value)
  })

  it('follows a client that a static import evaluated, with no call through the loader', async () => {
    const { useBetterAuth, settleSessionWithoutClient } = await deferred()
    const { registerAuthClient } = await import('../../../../src/runtime/better-auth/vue/auth-client-loader')
    const { session, isAuthenticated } = useBetterAuth()
    settleSessionWithoutClient()

    // What the module's build step appends to the client module (D-18).
    registerAuthClient(fakeClient as never)
    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }

    expect(session.value).toBe(sessionRef.value)
    expect(isAuthenticated.value).toBe(true)
  })

  it('asks the client for a forced token request on a session settled without it', async () => {
    const { useBetterAuth, settleSessionWithoutClient, loadedAuthClient } = await deferred()
    const { fetchAccessToken } = useBetterAuth()
    settleSessionWithoutClient()

    // Signed in elsewhere since the server rendered: the client's store knows.
    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }
    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBe('jwt-after-sign-in')
    expect(loadedAuthClient()).toBe(fakeClient)
  })

  it('answers an unforced token request on a settled session without loading the client', async () => {
    const { useBetterAuth, settleSessionWithoutClient, loadedAuthClient } = await deferred()
    const { fetchAccessToken } = useBetterAuth()
    settleSessionWithoutClient()

    await expect(fetchAccessToken({ forceRefreshToken: false })).resolves.toBeNull()
    expect(loadedAuthClient()).toBeUndefined()
  })

  it('waits for the client\'s own answer before a guarded route decides', async () => {
    const { useBetterAuth, settleSessionWithoutClient, clientSessionSettled } = await deferred()
    const { session } = useBetterAuth()
    settleSessionWithoutClient()
    sessionRef.value = { data: null, isPending: true }

    let settled = false
    const waiting = clientSessionSettled().then(() => {
      settled = true
    })
    await vi.waitFor(() => expect(session.value.isPending).toBe(false))
    await Promise.resolve()
    expect(settled).toBe(false)

    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }
    await waiting
    expect(session.value).toBe(sessionRef.value)
  })

  it('lets a guarded route wait out a failed first load that the retry recovers', async () => {
    let failures = 1
    vi.doMock('#convex/auth-client', () => {
      if (failures-- > 0) throw new Error('chunk failed')
      return { authClient: fakeClient }
    })
    try {
      const { useBetterAuth, settleSessionWithoutClient, clientSessionSettled, loadedAuthClient } = await deferred()
      const { session } = useBetterAuth()
      settleSessionWithoutClient()
      sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }

      await clientSessionSettled()
      expect(loadedAuthClient()).toBe(fakeClient)
      expect(session.value).toBe(sessionRef.value)
    }
    finally {
      vi.doMock('#convex/auth-client', () => ({ authClient: fakeClient }))
    }
  })

  it('loads the client for a refetch asked of the waiting session', async () => {
    const { useBetterAuth, loadedAuthClient } = await deferred()
    const refetch = vi.fn(async () => {})
    sessionRef.value = { data: null, isPending: false, refetch } as never
    const { session } = useBetterAuth()

    await session.value.refetch()
    expect(loadedAuthClient()).toBe(fakeClient)
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})

describe('a client chunk that fails to load at startup', () => {
  beforeEach(() => {
    vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: () => {}, removeEventListener: () => {} })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doMock('#convex/auth-client', () => ({ authClient: fakeClient }))
  })

  it('is asked for once more before anything gives up', async () => {
    let failures = 1
    vi.doMock('#convex/auth-client', () => {
      if (failures-- > 0) throw new Error('chunk failed')
      return { authClient: fakeClient }
    })
    sessionRef.value = { data: null, isPending: false }
    const { loadedAuthClient } = await loader()
    const { useBetterAuth } = await import('../../../../src/runtime/better-auth/vue/use-better-auth')
    const { session } = useBetterAuth()

    await vi.waitFor(() => expect(loadedAuthClient()).toBe(fakeClient))
    expect(session.value).toBe(sessionRef.value)
  })

  it('keeps the server\'s token after a second failure, and asks again when the browser is back online', async () => {
    let failing = true
    vi.doMock('#convex/auth-client', () => {
      if (failing) throw new Error('chunk failed')
      return { authClient: fakeClient }
    })
    const online: Array<() => void> = []
    vi.stubGlobal('window', { addEventListener: (type: string, listener: () => void) => type === 'online' && online.push(listener), removeEventListener: () => {} })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { loadedAuthClient } = await loader()
    const { useBetterAuth } = await import('../../../../src/runtime/better-auth/vue/use-better-auth')
    const serverToken = `header.${Buffer.from(JSON.stringify({ sessionId: 'session-1' })).toString('base64url')}.signature`
    const { session, isAuthenticated, fetchAccessToken } = useBetterAuth(serverToken)

    await vi.waitFor(() => expect(online).toHaveLength(1))
    // Signed in on the token: nothing settled it signed out, nothing dropped it.
    expect(session.value.isPending).toBe(true)
    expect(isAuthenticated.value).toBe(true)
    await expect(fetchAccessToken({ forceRefreshToken: false })).resolves.toBe(serverToken)

    failing = false
    vi.resetModules()
    online[0]!()
    await vi.waitFor(() => expect(loadedAuthClient()).toBe(fakeClient))
    warn.mockRestore()
  })

  it('settles the session signed out, with the error, after a second failure', async () => {
    vi.doMock('#convex/auth-client', () => {
      throw new Error('chunk failed')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await loader()
    const { useBetterAuth } = await import('../../../../src/runtime/better-auth/vue/use-better-auth')
    const { session, isLoading, user } = useBetterAuth()

    await vi.waitFor(() => expect(session.value.isPending).toBe(false))
    expect(session.value.error).toBeInstanceOf(Error)
    expect(isLoading.value).toBe(false)
    expect(user.value).toBeNull()
    expect(warn).toHaveBeenCalledWith('[nuxt-convex-module] Failed to load the Better Auth client:', expect.any(Error))
    warn.mockRestore()
  })
})
