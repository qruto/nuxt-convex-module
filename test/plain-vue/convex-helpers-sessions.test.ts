import { flushPromises, mount } from '@vue/test-utils'
import type { SessionId } from 'convex-helpers/server/sessions'
import { makeFunctionReference, type FunctionReference } from 'convex/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide, ref, type MaybeRefOrGetter } from 'vue'
import {
  ConvexVueSessionClient,
  DEFAULT_STORAGE_KEY,
  provideSession,
  SessionProvider,
  useSessionAction,
  useSessionId,
  useSessionIdArg,
  useSessionMutation,
  useSessionPaginatedQuery,
  useSessionQuery,
  type SessionProviderOptions,
} from '../../src/runtime/convex-helpers/vue/sessions'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

// The Vue counterpart of upstream's `react/sessions.test.ts` (its client
// scenarios; the type scenarios are in test/types), then the provider and
// the composables, which upstream's tests leave out.

describe('ConvexVueSessionClient', () => {
  let mockClient: { query: ReturnType<typeof vi.fn>, mutation: ReturnType<typeof vi.fn>, action: ReturnType<typeof vi.fn> }
  let sessionClient: ConvexVueSessionClient
  const sessionId = 'test-session-id' as SessionId

  beforeEach(() => {
    mockClient = {
      query: vi.fn().mockResolvedValue('query-result'),
      mutation: vi.fn().mockResolvedValue('mutation-result'),
      action: vi.fn().mockResolvedValue('action-result'),
    }
    sessionClient = new ConvexVueSessionClient('http://localhost:3000', {
      sessionId,
    })
    // Stand in for the network calls, as upstream's test does.
    Object.assign(sessionClient, mockClient)
  })

  it('should inject sessionId into query args', async () => {
    const query = {} as FunctionReference<'query', 'public', { arg: string, sessionId: SessionId | null }, unknown>
    const args = { arg: ' foo' }

    const result = await sessionClient.sessionQuery(query, args)

    expect(mockClient.query).toHaveBeenCalledWith(query, { arg: ' foo', sessionId })
    expect(result).toBe('query-result')
  })

  it('should inject sessionId into mutation args', async () => {
    const mutation = {} as FunctionReference<'mutation', 'public', { arg: string, sessionId: SessionId }, unknown>
    const args = { arg: 'foo' }

    const result = await sessionClient.sessionMutation(mutation, args)

    expect(mockClient.mutation).toHaveBeenCalledWith(
      mutation,
      { ...args, sessionId },
      // options, e.g. for optimistic updates
      undefined,
    )
    expect(result).toBe('mutation-result')
  })

  it('should inject sessionId into action args', async () => {
    const action = {} as FunctionReference<'action', 'public', { arg: string, sessionId: SessionId }, unknown>
    const args = { arg: 'foo' }

    const result = await sessionClient.sessionAction(action, args)

    expect(mockClient.action).toHaveBeenCalledWith(action, { ...args, sessionId })
    expect(result).toBe('action-result')
  })

  it('should allow changing the sessionId', async () => {
    const newSessionId = 'new-session-id' as SessionId
    const query = {} as FunctionReference<'query', 'public', { arg: string, sessionId: SessionId }, unknown>

    sessionClient.setSessionId(newSessionId)

    await sessionClient.sessionQuery(query, { arg: 'foo' })

    expect(mockClient.query).toHaveBeenCalledWith(query, { arg: 'foo', sessionId: newSessionId })
    expect(sessionClient.getSessionId()).toBe(newSessionId)
  })

  it('should allow omitting args if the only arg is sessionId', async () => {
    const query = {} as FunctionReference<'query', 'public', { sessionId: SessionId }, unknown>

    expect(await sessionClient.sessionQuery(query)).toBe('query-result')
    expect(mockClient.query).toHaveBeenCalledWith(query, { sessionId })

    const mutation = {} as FunctionReference<'mutation', 'public', { sessionId: SessionId }, unknown>

    expect(await sessionClient.sessionMutation(mutation)).toBe('mutation-result')
    expect(mockClient.mutation).toHaveBeenCalledWith(mutation, { sessionId }, undefined)

    const action = {} as FunctionReference<'action', 'public', { sessionId: SessionId }, unknown>

    expect(await sessionClient.sessionAction(action)).toBe('action-result')
    expect(mockClient.action).toHaveBeenCalledWith(action, { sessionId })
  })

  it('keeps the session in sessionStorage across clients', () => {
    sessionStorage.clear()
    const first = new ConvexVueSessionClient('http://localhost:3000')
    const second = new ConvexVueSessionClient('http://localhost:3000')
    expect(second.getSessionId()).toBe(first.getSessionId())
    expect(sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBe(first.getSessionId())
  })
})

// A client whose watches and calls are recorded.
function fakeClient() {
  const watched: unknown[] = []
  const client = {
    watchQuery: vi.fn((_query: unknown, args: unknown) => {
      watched.push(args)
      return { localQueryResult: () => 'result', onUpdate: () => () => {}, journal: () => undefined }
    }),
    mutation: vi.fn().mockResolvedValue('mutation-result'),
    action: vi.fn().mockResolvedValue('action-result'),
    logger: { warn: vi.fn() },
  }
  return { client: client as unknown as ConvexVueClient, mock: client, watched }
}

/** Run `useComposable` below the client and `provideSession(options)`. */
function mountSession<T>(client: ConvexVueClient, useComposable: () => T, options: MaybeRefOrGetter<SessionProviderOptions> = {}) {
  const result = {} as { current: T }
  const Child = defineComponent({
    setup() {
      result.current = useComposable()
      return () => null
    },
  })
  // A component cannot inject what it provides itself.
  const Session = defineComponent({
    setup() {
      provideSession(options)
      return () => h(Child)
    },
  })
  const wrapper = mount(defineComponent({
    setup() {
      provide(ConvexClientKey, client)
      return () => h(Session)
    },
  }))
  return { result, wrapper }
}

const sessionQuery = makeFunctionReference<'query', { arg: string, sessionId: SessionId }, string>('test:query')
const sessionMutation = makeFunctionReference<'mutation', { arg: string, sessionId: SessionId }, string>('test:mutation')
const sessionAction = makeFunctionReference<'action', { arg: string, sessionId: SessionId }, string>('test:action')

describe('provideSession', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('creates a session ID, keeps it in sessionStorage, and passes it to every call', async () => {
    const { client, mock, watched } = fakeClient()
    const { result } = mountSession(client, () => ({
      id: useSessionId(),
      query: useSessionQuery(sessionQuery, { arg: 'a' }),
      mutation: useSessionMutation(sessionMutation),
      action: useSessionAction(sessionAction),
    }), { idGenerator: () => 'session-1' })

    const [id] = result.current.id
    expect(id.value).toBe('session-1')
    expect(sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBe('session-1')
    expect(result.current.query.value).toBe('result')
    expect(watched).toContainEqual({ arg: 'a', sessionId: 'session-1' })

    await result.current.mutation({ arg: 'b' })
    expect(mock.mutation).toHaveBeenCalledWith(sessionMutation, { arg: 'b', sessionId: 'session-1' }, expect.anything())
    await result.current.action({ arg: 'c' })
    expect(mock.action).toHaveBeenCalledWith(sessionAction, { arg: 'c', sessionId: 'session-1' })
  })

  it('reuses the session ID stored in this tab', () => {
    sessionStorage.setItem(DEFAULT_STORAGE_KEY, 'stored-session')
    const { client } = fakeClient()
    const { result } = mountSession(client, () => useSessionId(), { idGenerator: () => 'new-session' })
    expect(result.current[0].value).toBe('stored-session')
  })

  it('refreshes the session ID after the callback it is given', async () => {
    const { client, watched } = fakeClient()
    let n = 0
    const { result } = mountSession(client, () => ({
      id: useSessionId(),
      query: useSessionQuery(sessionQuery, { arg: 'a' }),
    }), { idGenerator: () => `session-${++n}` })
    const [id, refresh] = result.current.id
    const before = vi.fn()

    const fresh = await refresh(before)
    await flushPromises()

    expect(before).toHaveBeenCalledWith('session-2')
    expect(fresh).toBe('session-2')
    expect(id.value).toBe('session-2')
    expect(sessionStorage.getItem(DEFAULT_STORAGE_KEY)).toBe('session-2')
    expect(watched).toContainEqual({ arg: 'a', sessionId: 'session-2' })
  })

  it('with ssrFriendly, skips queries and holds calls until the client has mounted', async () => {
    const { client, mock, watched } = fakeClient()
    const ids: Array<SessionId | undefined> = []
    const { result } = mountSession(client, () => {
      const [id] = useSessionId()
      ids.push(id.value)
      return {
        id,
        arg: useSessionIdArg({ arg: 'a' }),
        mutation: useSessionMutation(sessionMutation),
      }
    }, { ssrFriendly: true, idGenerator: () => 'session-1' })

    // Setup ran before the mount: no ID yet, as on the server.
    expect(ids).toEqual([undefined])
    await flushPromises()
    expect(result.current.id.value).toBe('session-1')
    expect(result.current.arg.value).toEqual({ arg: 'a', sessionId: 'session-1' })
    await result.current.mutation({ arg: 'b' })
    expect(mock.mutation).toHaveBeenCalledWith(sessionMutation, { arg: 'b', sessionId: 'session-1' }, expect.anything())
    expect(watched).toEqual([])
  })

  it('with ssrFriendly, a call made during setup waits for the ID', async () => {
    const { client, mock } = fakeClient()
    let pending: Promise<unknown> | undefined
    mountSession(client, () => {
      const mutation = useSessionMutation(sessionMutation)
      pending = mutation({ arg: 'b' })
    }, { ssrFriendly: true, idGenerator: () => 'session-1' })

    await pending
    expect(mock.mutation).toHaveBeenCalledWith(sessionMutation, { arg: 'b', sessionId: 'session-1' }, expect.anything())
  })

  it('useSessionIdArg passes "skip" through', () => {
    const { client } = fakeClient()
    const { result } = mountSession(client, () => useSessionIdArg('skip'), { idGenerator: () => 'session-1' })
    expect(result.current.value).toBe('skip')
  })

  it('stores the ID through a custom useStorage', () => {
    // Like VueUse's `useLocalStorage`: the initial value when nothing is stored.
    const store = ref<SessionId | undefined>(undefined)
    const useStorage = vi.fn((_key: string, initial: SessionId | undefined) => {
      store.value ??= initial
      return store
    })
    const { client } = fakeClient()
    const { result } = mountSession(client, () => useSessionId(), { useStorage, storageKey: 'my-key', idGenerator: () => 'session-1' })
    expect(useStorage).toHaveBeenCalledWith('my-key', 'session-1')
    expect(result.current[0].value).toBe('session-1')
    expect(store.value).toBe('session-1')
  })

  it('skips the query while its args are "skip"', async () => {
    const { client, watched } = fakeClient()
    const args = ref<{ arg: string } | 'skip'>('skip')
    const { result } = mountSession(client, () => useSessionQuery(sessionQuery, args), { idGenerator: () => 'session-1' })
    expect(result.current.value).toBeUndefined()
    expect(watched).toEqual([])

    args.value = { arg: 'a' }
    await flushPromises()
    expect(watched).toContainEqual({ arg: 'a', sessionId: 'session-1' })
  })

  it('the component form provides the same session', () => {
    const { client } = fakeClient()
    const result = {} as { id: ReturnType<typeof useSessionId> }
    const Child = defineComponent({
      setup() {
        result.id = useSessionId()
        return () => null
      },
    })
    mount(defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(SessionProvider, { idGenerator: () => 'session-1' }, () => h(Child))
      },
    }))
    expect(result.id[0].value).toBe('session-1')
  })

  it('needs a provider above it', () => {
    expect(() => mount(defineComponent({
      setup() {
        useSessionId()
        return () => null
      },
    }))).toThrow('Missing a <SessionProvider> wrapping this code.')
  })

  // PARITY: F-09
  // Upstream tells the session client only about an ID it generates for an
  // empty store, so after a refresh the client's own calls keep the old one.
  it('a refresh reaches the session client too', async () => {
    const client = new ConvexVueSessionClient('http://localhost:3000', { sessionId: 'client-1' as SessionId })
    const { result } = mountSession(client, () => useSessionId(), { idGenerator: () => 'session-2' })
    expect(result.current[0].value).toBe('client-1')

    await result.current[1]()

    expect(result.current[0].value).toBe('session-2')
    expect(client.getSessionId()).toBe('session-2')
  })

  // Upstream reads its props on every render.
  it('a new storageKey reads its own store', async () => {
    sessionStorage.setItem('key-b', 'session-b')
    const options = ref<SessionProviderOptions>({ storageKey: 'key-a', idGenerator: () => 'session-a' })
    const { client } = fakeClient()
    const { result } = mountSession(client, () => useSessionId(), options)
    expect(result.current[0].value).toBe('session-a')

    options.value = { ...options.value, storageKey: 'key-b' }
    await flushPromises()

    expect(result.current[0].value).toBe('session-b')
  })

  // Upstream checks on every render.
  it('useSessionId\'s ref throws once the stored ID is gone, until a new one is made', async () => {
    const store = ref<SessionId | undefined>(undefined)
    const useStorage = (_key: string, initial: SessionId | undefined) => {
      store.value ??= initial
      return store
    }
    let n = 0
    const { client } = fakeClient()
    const { result } = mountSession(client, () => useSessionId(), { useStorage, idGenerator: () => `session-${++n}` })
    const [id] = result.current

    store.value = undefined
    expect(() => id.value).toThrow('Session ID invalid. Clear your storage?')
    await flushPromises()
    expect(id.value).toBe('session-2')
  })

  // `crypto.randomUUID` needs a secure context: an `http://` address other
  // than localhost has none.
  it('makes a UUID without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) })
    const { client } = fakeClient()
    const { result } = mountSession(client, () => useSessionId())
    vi.unstubAllGlobals()
    expect(result.current[0].value).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/)
  })

  it('runs a paginated query with the session ID', async () => {
    const { client, watched } = fakeClient()
    const listQuery = makeFunctionReference<'query', { arg: string, sessionId: SessionId, paginationOpts: { numItems: number, cursor: string | null } }, { page: string[], isDone: boolean, continueCursor: string }>('test:list')
    mountSession(client, () => useSessionPaginatedQuery(listQuery, { arg: 'a' }, { initialNumItems: 3 }), { idGenerator: () => 'session-1' })
    await flushPromises()
    expect(watched).toContainEqual(expect.objectContaining({ arg: 'a', sessionId: 'session-1', paginationOpts: expect.objectContaining({ numItems: 3, cursor: null }) }))
  })

  it('a mutation with an optimistic update still gets the session ID', async () => {
    const { client, mock } = fakeClient()
    const update = vi.fn()
    const { result } = mountSession(client, () => useSessionMutation(sessionMutation), { idGenerator: () => 'session-1' })
    await result.current.withOptimisticUpdate(update)({ arg: 'b' })
    expect(mock.mutation).toHaveBeenCalledWith(sessionMutation, { arg: 'b', sessionId: 'session-1' }, expect.objectContaining({ optimisticUpdate: update }))
  })
})
