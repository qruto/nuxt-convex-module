import type { StreamBody, StreamId } from '@convex-dev/persistent-text-streaming'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, reactive } from 'vue'
import { useStream } from '../../src/runtime/persistent-text-streaming/vue/index'

// The Vue counterpart of upstream's `src/svelte/index.svelte.test.ts`, the
// entry the port follows, scenario for scenario.

// Stands in for the Convex subscription: a subscribed stream id returns the
// body stored for it, and "skip" returns nothing. The map is reactive, so a
// later write reaches the composable like a subscription update.
const persisted = vi.hoisted(() => ({ map: undefined as unknown as Map<string, StreamBody> }))
vi.mock('../../src/runtime/vue/composables/use-query', async () => {
  const { computed, reactive } = await import('vue')
  persisted.map = reactive(new Map<string, StreamBody>())
  return {
    useQuery: (_query: unknown, getArgs: () => { streamId: string } | 'skip') =>
      computed(() => {
        const args = getArgs()
        return args === 'skip' ? undefined : persisted.map.get(args.streamId)
      }),
  }
})

const query = {} as Parameters<typeof useStream>[0]
const url = new URL('https://example.convex.site/chat-stream')

type FetchInit = {
  body: string
  headers: Record<string, string>
  signal: AbortSignal
}
type Options = { authToken: string, headers: Record<string, string> }
const fetchMock = vi.fn<(url: URL, init: FetchInit) => Promise<Response>>()

function controlledResponse() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
    },
  })
  return { response: new Response(body), controller }
}

function render(
  initial: { driven: boolean, streamId?: string },
  opts?: Parameters<typeof useStream>[4],
) {
  const props = reactive(initial)
  const result = {} as { stream: ReturnType<typeof useStream> }
  const wrapper = mount(defineComponent({
    setup() {
      result.stream = useStream(
        query,
        url,
        () => props.driven,
        () => props.streamId as StreamId | undefined,
        opts,
      )
      return () => null
    },
  }))
  return { props, stream: result.stream, destroy: () => wrapper.unmount() }
}

const requestedIds = () =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).streamId)

let consoleError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  persisted.map.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useStream (vue)', () => {
  it('decodes characters split across chunks', async () => {
    const { response, controller } = controlledResponse()
    fetchMock.mockResolvedValue(response)
    const { stream, destroy } = render({ driven: true, streamId: 'a' })

    const bytes = new TextEncoder().encode('héllo 👋')
    // Split inside "é" (2 bytes) and inside the emoji (4 bytes).
    controller.enqueue(bytes.slice(0, 2))
    controller.enqueue(bytes.slice(2, 9))
    controller.enqueue(bytes.slice(9))
    controller.close()

    await vi.waitFor(() => expect(stream.value.status).toBe('done'))
    expect(stream.value.text).toBe('héllo 👋')
    destroy()
  })

  it('a new streamId resets the text and starts a new request', async () => {
    const first = controlledResponse()
    const second = controlledResponse()
    fetchMock
      .mockResolvedValueOnce(first.response)
      .mockResolvedValueOnce(second.response)
    const { props, stream, destroy } = render({ driven: true, streamId: 'a' })

    first.controller.enqueue(new TextEncoder().encode('first'))
    await vi.waitFor(() => expect(stream.value.text).toBe('first'))

    props.streamId = 'b'
    await nextTick()
    expect(stream.value).toMatchObject({ text: '', status: 'pending' })
    expect(requestedIds()).toEqual(['a', 'b'])
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(true)

    second.controller.enqueue(new TextEncoder().encode('second'))
    second.controller.close()
    await vi.waitFor(() => expect(stream.value.status).toBe('done'))
    expect(stream.value.text).toBe('second')
    destroy()
  })

  it('an undefined streamId shows empty text and pending', async () => {
    const { response, controller } = controlledResponse()
    fetchMock.mockResolvedValue(response)
    const { props, stream, destroy } = render({ driven: true, streamId: 'a' })

    controller.enqueue(new TextEncoder().encode('done text'))
    controller.close()
    await vi.waitFor(() => expect(stream.value.status).toBe('done'))

    props.streamId = undefined
    await nextTick()
    expect(stream.value).toMatchObject({ text: '', status: 'pending' })
    destroy()
  })

  it('switching to a stream this session does not drive hides the last one', async () => {
    const { response, controller } = controlledResponse()
    fetchMock.mockResolvedValue(response)
    const { props, stream, destroy } = render({ driven: true, streamId: 'a' })

    controller.enqueue(new TextEncoder().encode('done text'))
    controller.close()
    await vi.waitFor(() => expect(stream.value.status).toBe('done'))

    props.driven = false
    props.streamId = 'b'
    await nextTick()
    expect(stream.value).toMatchObject({ text: '', status: 'pending' })

    persisted.map.set('b', { text: 'from the database', status: 'done' })
    expect(stream.value).toMatchObject({ text: 'from the database', status: 'done' })
    destroy()
  })

  it('does not restart when the getter re-runs with the same streamId', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const message = reactive({ current: { streamId: 'a' } })
    const wrapper = mount(defineComponent({
      setup() {
        useStream(query, url, () => true, () => message.current.streamId as StreamId)
        return () => null
      },
    }))

    message.current = { streamId: 'a' }
    await nextTick()

    expect(requestedIds()).toEqual(['a'])
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(false)
    wrapper.unmount()
  })

  it('teardown aborts the request without reporting an error', async () => {
    // Like the real fetch, reject once the request is aborted.
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )
    const { stream, destroy } = render({ driven: true, streamId: 'a' })

    destroy()

    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(stream.value.status).toBe('pending')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('a response settling after a switch does not leak into the next stream', async () => {
    let settle!: (response: Response) => void
    fetchMock
      .mockReturnValueOnce(new Promise((resolve) => {
        settle = resolve
      }))
      .mockReturnValueOnce(new Promise(() => {}))
    const { props, stream, destroy } = render({ driven: true, streamId: 'a' })

    // Switch before the first response arrives. Svelte's `flushSync` reruns
    // the effect before the response's continuation; a Vue watcher reruns on
    // the next tick, so the response is held until after it.
    props.streamId = 'b'
    await nextTick()
    settle(new Response(null, { status: 205 }))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(stream.value.status).toBe('pending')
    destroy()
  })

  it('a rejected fetch falls back to the persisted body', async () => {
    persisted.map.set('a', { text: 'partial', status: 'streaming' })
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { stream, destroy } = render({ driven: true, streamId: 'a' })

    await vi.waitFor(() => expect(stream.value.text).toBe('partial'))
    persisted.map.set('a', { text: 'partial and more', status: 'done' })
    expect(stream.value).toMatchObject({ text: 'partial and more', status: 'done' })
    destroy()
  })

  it('resuming a stream before its first chunk persists does not POST again', async () => {
    // Like the real fetch, reject once the request is aborted.
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )
    persisted.map.set('a', { text: '', status: 'pending' })
    const { props, stream, destroy } = render({ driven: true, streamId: 'a' })

    props.driven = false
    await nextTick()
    props.driven = true
    await nextTick()
    persisted.map.set('a', { text: 'first chunk', status: 'streaming' })

    expect(requestedIds()).toEqual(['a'])
    expect(stream.value).toMatchObject({ text: 'first chunk', status: 'streaming' })

    // A new stream still streams over HTTP, and its request stays open.
    const b = controlledResponse()
    fetchMock.mockResolvedValueOnce(b.response)
    props.streamId = 'b'
    await nextTick()
    expect(requestedIds()).toEqual(['a', 'b'])
    expect(stream.value).toMatchObject({ text: '', status: 'pending' })

    b.controller.enqueue(new TextEncoder().encode('from http'))
    await vi.waitFor(() =>
      expect(stream.value).toMatchObject({ text: 'from http', status: 'streaming' }),
    )
    expect(fetchMock.mock.calls[1]![1].signal.aborted).toBe(false)
    destroy()
  })

  it.each([
    ['the token', (o: Options) => (o.authToken = 'new')],
    ['a header', (o: Options) => (o.headers['X-Trace'] = 'new')],
  ])('changing %s does not restart the request', async (_name, change) => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const options = reactive<Options>({
      authToken: 'old',
      headers: { 'X-Trace': 'old' },
    })
    const { destroy } = render({ driven: true, streamId: 'a' }, () => options)

    change(options)
    await nextTick()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(false)
    expect(fetchMock.mock.calls[0]![1].headers).toMatchObject({
      'Authorization': 'Bearer old',
      'X-Trace': 'old',
    })
    destroy()
  })

  it.each([205, 500])(
    'a %i response falls back to the persisted body',
    async (status) => {
      persisted.map.set('a', { text: 'from the database', status: 'done' })
      fetchMock.mockResolvedValue(new Response(null, { status }))
      const { stream, destroy } = render({ driven: true, streamId: 'a' })

      await vi.waitFor(() => expect(stream.value.text).toBe('from the database'))
      destroy()
    },
  )

  // The Svelte tests leave the request's own shape out.
  it('posts the stream id to the stream URL with the options read at the start', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const { destroy } = render({ driven: true, streamId: 'a' }, { authToken: 'token-1', headers: { 'X-Trace': 't' } })
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ streamId: 'a' }),
      headers: { 'Content-Type': 'application/json', 'X-Trace': 't', 'Authorization': 'Bearer token-1' },
    }))
    destroy()
  })
})
