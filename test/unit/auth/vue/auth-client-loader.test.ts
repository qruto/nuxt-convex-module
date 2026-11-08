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
  $store: { name: 'store' },
  useSession: () => sessionRef,
  useActiveOrganization: vi.fn((..._args: unknown[]) => organizationRef),
}
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
