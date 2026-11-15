import { flushPromises, mount } from '@vue/test-utils'
import { makeFunctionReference } from 'convex/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, provide, ref, type Ref } from 'vue'
import FacePile from '../../src/runtime/presence/vue/facepile'
import usePresence, { type PresenceAPI, type PresenceState } from '../../src/runtime/presence/vue/index'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

// The Vue counterpart of upstream's `src/react/index.test.tsx`, scenario for
// scenario, with the fake backend unchanged. Upstream mocks `convex/react`;
// here the module's own `useMutation` and `useQuery` are mocked.

// Response latency of the fake backend, long enough that cleanups
// deterministically run while a heartbeat is still in flight.
const LATENCY = 100

// A fake backend mirroring the presence component's semantics: state changes
// apply in dispatch order (Convex runs a client's mutations in order) while
// responses arrive after a delay; heartbeat reuses the session's token while
// the session is alive and mints a new one if it was disconnected.
const backend = vi.hoisted(() => {
  let nextToken = 0
  const sessions = new Map<string, string>() // sessionId -> live token
  const issuedTokens = new Set<string>()
  const disconnectedTokens = new Set<string>()
  const heartbeat = async ({ sessionId }: { sessionId: string }) => {
    let sessionToken = sessions.get(sessionId)
    if (sessionToken === undefined) {
      sessionToken = `token-${nextToken++}-${sessionId}`
      sessions.set(sessionId, sessionToken)
    }
    issuedTokens.add(sessionToken)
    await new Promise(resolve => setTimeout(resolve, LATENCY))
    return { roomToken: 'room-token', sessionToken }
  }
  const disconnect = async ({ sessionToken }: { sessionToken: string }) => {
    disconnectedTokens.add(sessionToken)
    for (const [sessionId, token] of sessions) {
      if (token === sessionToken) {
        sessions.delete(sessionId)
      }
    }
  }
  const reset = () => {
    nextToken = 0
    sessions.clear()
    issuedTokens.clear()
    disconnectedTokens.clear()
  }
  return { sessions, issuedTokens, disconnectedTokens, heartbeat, disconnect, reset }
})

const listResult = vi.hoisted(() => ({ value: undefined as unknown, args: undefined as undefined | (() => unknown) }))
vi.mock('../../src/runtime/vue/composables/use-mutation', () => ({
  useMutation: (reference: unknown) => (reference === 'heartbeat' ? backend.heartbeat : backend.disconnect),
}))
vi.mock('../../src/runtime/vue/composables/use-query', async () => {
  const { computed } = await import('vue')
  return {
    useQuery: (_query: unknown, args: () => unknown) => {
      listResult.args = args
      return computed(() => listResult.value)
    },
  }
})

const presenceApi = {
  list: 'list',
  heartbeat: 'heartbeat',
  disconnect: makeFunctionReference<'mutation'>('presence:disconnect'),
} as unknown as PresenceAPI

const convexClient = { url: 'https://test.convex.cloud' } as unknown as ConvexVueClient

function mountPresence({
  roomId = ref('room1') as Ref<string>,
  userId = ref('user1') as Ref<string>,
  interval = ref(10000) as Ref<number>,
  presence = presenceApi,
} = {}) {
  const result = {} as { state: ReturnType<typeof usePresence> }
  const Child = defineComponent({
    setup() {
      result.state = usePresence(presence, roomId, userId, interval)
      return () => null
    },
  })
  const wrapper = mount(defineComponent({
    setup() {
      provide(ConvexClientKey, convexClient)
      return () => h(Child)
    },
  }))
  return { wrapper, roomId, userId, interval, result }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

beforeEach(() => {
  backend.reset()
  listResult.value = undefined
})

describe('usePresence', () => {
  // Upstream's Strict Mode scenario: React mounts, unmounts and remounts the
  // component, and the remount's cleanup runs before the first heartbeat's
  // token has arrived. Vue has no such double mount; the same race is an
  // unmount before the first heartbeat answers.
  it('an unmount before the first heartbeat answers disconnects the session it gets', async () => {
    const { wrapper } = mountPresence()
    await nextTick()
    wrapper.unmount()

    // Let in-flight heartbeats resolve and their continuations run.
    await sleep(5 * LATENCY)

    expect(backend.issuedTokens.size).toBe(1)
    // Every session the backend ever created must be disconnected by now.
    expect(backend.sessions.size).toBe(0)
    expect([...backend.disconnectedTokens].sort()).toEqual([...backend.issuedTokens].sort())
  })

  it('reuses one session and disconnects it on unmount', async () => {
    const { wrapper } = mountPresence()
    await sleep(5 * LATENCY)

    expect(backend.issuedTokens.size).toBe(1)
    expect(backend.sessions.size).toBe(1)

    wrapper.unmount()
    await sleep(LATENCY)

    expect(backend.sessions.size).toBe(0)
    expect([...backend.disconnectedTokens].sort()).toEqual([...backend.issuedTokens].sort())
  })

  it('a room change disconnects an in-flight session', async () => {
    const { wrapper, roomId } = mountPresence()
    await nextTick()

    // Change rooms before the first heartbeat response supplies its token.
    roomId.value = 'room2'
    await sleep(5 * LATENCY)

    expect(backend.issuedTokens.size).toBe(2)
    expect(backend.disconnectedTokens.size).toBe(1)
    expect(backend.sessions.size).toBe(1)

    wrapper.unmount()
    await sleep(LATENCY)
    expect(backend.sessions.size).toBe(0)
    expect([...backend.disconnectedTokens].sort()).toEqual([...backend.issuedTokens].sort())
  })

  it('a session taken over by a re-run watcher is not disconnected', async () => {
    const { wrapper, interval } = mountPresence()
    // Let the mount settle: one live session with its token stored.
    await sleep(5 * LATENCY)
    expect(backend.sessions.size).toBe(1)

    // Changing `interval` re-runs the heartbeat watcher WITHOUT rotating the
    // sessionId, so the next run heartbeats the same session...
    interval.value = 20000
    // ...and before that heartbeat's response arrives, a second change cleans
    // that run up too. Its canceled continuation must recognize that the
    // newest run still owns the session and must NOT disconnect it.
    await sleep(LATENCY / 2)
    interval.value = 30000
    await sleep(5 * LATENCY)

    // The user still has the original live session. Changing only the heartbeat
    // interval must not disconnect and recreate it.
    expect(backend.sessions.size).toBe(1)
    expect(backend.issuedTokens.size).toBe(1)
    expect(backend.disconnectedTokens.size).toBe(0)

    wrapper.unmount()
    await sleep(LATENCY)
    expect(backend.sessions.size).toBe(0)
    expect([...backend.disconnectedTokens].sort()).toEqual([...backend.issuedTokens].sort())
  })

  // PARITY: F-06
  it('the unload beacon calls the disconnect function it was given', async () => {
    const sendBeacon = vi.fn((_url: string, _data: Blob) => true)
    Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true })
    // The app's functions live in convex/rooms/presence.ts, not convex/presence.ts.
    const presence = {
      ...presenceApi,
      disconnect: makeFunctionReference<'mutation'>('rooms/presence:disconnect'),
    } as unknown as PresenceAPI
    const { wrapper } = mountPresence({ presence })
    await sleep(5 * LATENCY)

    window.dispatchEvent(new Event('beforeunload'))

    expect(sendBeacon).toHaveBeenCalledTimes(1)
    const [url, blob] = sendBeacon.mock.calls[0]!
    expect(url).toBe('https://test.convex.cloud/api/mutation')
    expect(JSON.parse(await blob.text())).toEqual({
      path: 'rooms/presence:disconnect',
      args: { sessionToken: [...backend.issuedTokens][0] },
    })

    wrapper.unmount()
  })

  // Upstream's tests leave the hidden tab and the sorting out.

  it('a hidden tab disconnects, and coming back starts a new session', async () => {
    const { wrapper } = mountPresence()
    await sleep(5 * LATENCY)
    const hidden = vi.spyOn(document, 'hidden', 'get')

    hidden.mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()
    expect(backend.sessions.size).toBe(0)

    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    await sleep(2 * LATENCY)
    expect(backend.sessions.size).toBe(1)
    expect(backend.issuedTokens.size).toBe(2)

    hidden.mockRestore()
    wrapper.unmount()
  })

  it('lists the current user first', async () => {
    const user = (userId: string): PresenceState => ({ userId, online: true, lastDisconnected: 0 })
    listResult.value = [user('ann'), user('user1'), user('bob')]
    const { result, userId } = mountPresence()

    expect(result.state.value?.map(p => p.userId)).toEqual(['user1', 'ann', 'bob'])
    userId.value = 'bob'
    expect(result.state.value?.map(p => p.userId)).toEqual(['bob', 'ann', 'user1'])
  })

  it('subscribes to the list once a heartbeat has given it the room', async () => {
    const { wrapper } = mountPresence()
    expect(listResult.args!()).toBe('skip')
    await sleep(2 * LATENCY)
    expect(listResult.args!()).toEqual({ roomToken: 'room-token' })
    wrapper.unmount()
  })

  it('a room change stops listing the old room before the new one answers', async () => {
    const { wrapper, roomId } = mountPresence()
    await sleep(2 * LATENCY)
    expect(listResult.args!()).toEqual({ roomToken: 'room-token' })

    roomId.value = 'room2'
    await nextTick()
    expect(listResult.args!()).toBe('skip')

    wrapper.unmount()
  })
})

describe('FacePile', () => {
  const person = (userId: string, extra: Partial<PresenceState> = {}): PresenceState =>
    ({ userId, online: true, lastDisconnected: 0, ...extra })

  it('shows five avatars and puts the rest in the drop-down', () => {
    const users = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => person(id))
    const wrapper = mount(FacePile, { props: { presenceState: users } })

    expect(wrapper.findAll('.avatars > .avatar')).toHaveLength(5)
    expect(wrapper.find('.avatar.more').text()).toBe('+2')
    expect(wrapper.findAll('.dropdown-row').map(row => row.find('.dropdown-user').text())).toEqual(['f', 'g'])
  })

  it('renders the online state, the name, the image and the data of an avatar', () => {
    const wrapper = mount(FacePile, {
      props: {
        presenceState: [
          person('alice', { name: 'Alice', image: 'https://example.com/a.png', data: { typing: true } }),
          person('bob', { online: false, lastDisconnected: Date.now() - 2 * 3600 * 1000 }),
        ],
      },
    })
    const [alice, bob] = wrapper.findAll('.avatars > .avatar')

    expect(alice!.classes()).toContain('online')
    expect(alice!.attributes('data-presence-typing')).toBe('true')
    expect(alice!.find('img').attributes('src')).toBe('https://example.com/a.png')
    expect(alice!.find('.tooltip-user').text()).toBe('Alice')
    expect(alice!.find('.tooltip-data').text()).toContain('typing: true')
    expect(alice!.attributes('style')).toContain('--z: 2')
    expect(bob!.classes()).toContain('offline')
    expect(bob!.find('.tooltip-status').text()).toBe('Last seen 2 hours ago')
    expect(wrapper.find('.more-container').exists()).toBe(false)
  })
})
