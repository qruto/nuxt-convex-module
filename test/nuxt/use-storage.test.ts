// PARITY: A-02
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, toRaw } from 'vue'
import { makeFunctionReference } from 'convex/server'
import { ConvexError } from 'convex/values'
import { ConvexVueClient } from '../../src/runtime/vue/client'
import { mountWithConvex } from '../helpers/vue_test_utils'
import { silentConnectLogger } from '../helpers/silent-logger'
import { useUpload } from '../../src/runtime/vue/composables/use-upload'
import { useUploadQueue } from '../../src/runtime/vue/composables/use-upload-queue'
import { useStorageUrl } from '../../src/runtime/vue/composables/use-storage-url'
import { FakeXhr, installFakeXhr } from '../helpers/fake-xhr'

const address = 'https://127.0.0.1:3001'
const uploadUrl = 'https://example.convex.cloud/upload'
const genUrlRef = makeFunctionReference<'mutation'>('files:generateUploadUrl')

let client: ConvexVueClient
let restoreXhr: () => void

beforeEach(() => {
  client = new ConvexVueClient(address, { logger: silentConnectLogger })
  restoreXhr = installFakeXhr()
})

afterEach(() => {
  restoreXhr()
  vi.restoreAllMocks()
})

/** Wait until `predicate` is true, flushing microtasks/ticks between checks. */
async function waitFor(predicate: () => boolean, ticks = 50): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    if (predicate()) return
    await nextTick()
  }
  if (!predicate()) throw new Error('waitFor: condition was never met')
}

describe('useUpload', () => {
  it('uploads a file and exposes progress and the storage id', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const onSuccess = vi.fn()

    const { result } = await mountWithConvex(client, () =>
      useUpload(genUrlRef, { onSuccess }))

    const promise = result.upload(new Blob(['data'], { type: 'image/png' }))
    expect(result.isUploading.value).toBe(true)

    await waitFor(() => FakeXhr.instances.length === 1)
    const xhr = FakeXhr.instances[0]!
    expect(xhr.headers['Content-Type']).toBe('image/png')

    xhr.emitProgress(40, 80)
    expect(result.progress.value).toBe(0.5)

    xhr.resolveWith('store_abc')
    const id = await promise

    expect(id).toBe('store_abc')
    expect(result.storageId.value).toBe('store_abc')
    expect(result.progress.value).toBe(1)
    expect(result.isUploading.value).toBe(false)
    expect(result.error.value).toBeNull()
    expect(onSuccess).toHaveBeenCalledWith('store_abc', expect.any(Blob))
  })

  it('records errors instead of throwing', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)

    const { result } = await mountWithConvex(client, () => useUpload(genUrlRef))

    const promise = result.upload(new Blob(['data']))
    await waitFor(() => FakeXhr.instances.length === 1)
    FakeXhr.instances[0]!.failWith(403, 'forbidden')

    const id = await promise
    expect(id).toBeNull()
    expect(result.error.value?.message).toMatch(/403/)
    expect(result.isUploading.value).toBe(false)
  })

  it('cancel aborts the in-flight upload', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)

    const { result } = await mountWithConvex(client, () => useUpload(genUrlRef))

    const promise = result.upload(new Blob(['data']))
    await waitFor(() => FakeXhr.instances.length === 1)

    result.cancel()
    const id = await promise

    expect(FakeXhr.instances[0]!.aborted).toBe(true)
    expect(id).toBeNull()
    expect(result.error.value).toBeInstanceOf(Error)
  })

  it('resolves null with a browser-only error when XMLHttpRequest is unavailable', async () => {
    const mutation = vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const onError = vi.fn()

    const { result } = await mountWithConvex(client, () => useUpload(genUrlRef, { onError }))

    // Simulate SSR: no XMLHttpRequest global at upload() time.
    const host = globalThis as { XMLHttpRequest?: unknown }
    const saved = host.XMLHttpRequest
    host.XMLHttpRequest = undefined
    try {
      const id = await result.upload(new Blob(['data']))
      expect(id).toBeNull()
    }
    finally {
      host.XMLHttpRequest = saved
    }

    expect(result.error.value?.message).toMatch(/browser/i)
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Blob))
    expect(result.isUploading.value).toBe(false)
    expect(mutation).not.toHaveBeenCalled()
  })

  it('reset clears progress, error, and storage id', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)

    const { result } = await mountWithConvex(client, () => useUpload(genUrlRef))

    const promise = result.upload(new Blob(['data']))
    await waitFor(() => FakeXhr.instances.length === 1)
    FakeXhr.instances[0]!.resolveWith('store_xyz')
    await promise

    result.reset()
    expect(result.progress.value).toBe(0)
    expect(result.error.value).toBeNull()
    expect(result.storageId.value).toBeNull()
  })
})

describe('useUploadQueue', () => {
  it('uploads every file with bounded concurrency', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const onComplete = vi.fn()

    const { result } = await mountWithConvex(client, () =>
      useUploadQueue(genUrlRef, { concurrency: 2, onComplete }))

    result.enqueue([new Blob(['a']), new Blob(['b']), new Blob(['c'])])
    expect(result.items.value.length).toBe(3)

    // Only `concurrency` items start; the third stays pending.
    await waitFor(() => FakeXhr.instances.length === 2)
    expect(result.activeCount.value).toBe(2)
    expect(result.pendingCount.value).toBe(1)

    FakeXhr.instances[0]!.resolveWith('s0')
    FakeXhr.instances[1]!.resolveWith('s1')

    // Finishing the first two frees a slot for the third.
    await waitFor(() => FakeXhr.instances.length === 3)
    FakeXhr.instances[2]!.resolveWith('s2')

    await waitFor(() => !result.isUploading.value)

    expect(result.items.value.map(item => item.storageId)).toEqual(['s0', 's1', 's2'])
    expect(result.items.value.every(item => item.status === 'success')).toBe(true)
    expect(result.progress.value).toBe(1)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('enqueues an array-like FileList (not a real Array or Blob)', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef))

    const fileListLike = {
      0: new Blob(['a']),
      1: new Blob(['b']),
      length: 2,
    } as unknown as FileList
    result.enqueue(fileListLike)

    expect(result.items.value).toHaveLength(2)

    await waitFor(() => FakeXhr.instances.length === 2)
    FakeXhr.instances[0]!.resolveWith('s0')
    FakeXhr.instances[1]!.resolveWith('s1')
    await waitFor(() => !result.isUploading.value)

    expect(result.items.value.map(item => item.storageId)).toEqual(['s0', 's1'])
  })

  it('remove aborts an in-flight item and drops it from the queue', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef))

    result.enqueue(new Blob(['a']))
    await waitFor(() => FakeXhr.instances.length === 1)
    expect(result.items.value[0]!.status).toBe('uploading')

    result.remove(result.items.value[0]!.id)

    expect(FakeXhr.instances[0]!.aborted).toBe(true)
    expect(result.items.value).toHaveLength(0)
    expect(result.isUploading.value).toBe(false)
  })

  it('clear empties the queue', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef))

    result.enqueue([new Blob(['a']), new Blob(['b'])])
    expect(result.items.value.length).toBe(2)

    result.clear()
    expect(result.items.value.length).toBe(0)
    expect(result.isUploading.value).toBe(false)
  })
})

describe('useUploadQueue hooks', () => {
  /** A promise and its settle functions, for a hook the test finishes by hand. */
  function deferred<T = void>() {
    let resolve!: (value: T) => void
    let reject!: (error: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  it('sends what prepare returns, and keeps it on the item', async () => {
    const mutation = vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const shrunk = new Blob(['small'])
    const preparing = deferred<Blob>()
    const prepare = vi.fn((_file: Blob) => preparing.promise)

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef, { prepare }))
    const original = new Blob(['large original'])
    result.enqueue(original)
    const item = result.items.value[0]!

    expect(item.stage).toBe('prepare')
    expect(toRaw(prepare.mock.calls[0]![0])).toBe(original)
    // No upload URL is asked for until the file is ready.
    expect(mutation).not.toHaveBeenCalled()

    preparing.resolve(shrunk)
    await waitFor(() => FakeXhr.instances.length === 1)
    expect(item.stage).toBe('upload')
    expect(FakeXhr.instances[0]!.sentBody).toBe(shrunk)
    FakeXhr.instances[0]!.resolveWith('s0')
    await waitFor(() => item.status === 'success')

    expect(toRaw(item.prepared)).toBe(shrunk)
    expect(item.stage).toBeNull()
  })

  it('keeps an item uploading until after settles, then calls onItemSuccess', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const finishing = deferred()
    const after = vi.fn(() => finishing.promise)
    const onItemSuccess = vi.fn()

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef, { after, onItemSuccess }))
    result.enqueue(new Blob(['a']))
    await waitFor(() => FakeXhr.instances.length === 1)
    FakeXhr.instances[0]!.resolveWith('s0')
    const item = result.items.value[0]!
    await waitFor(() => item.stage === 'after')

    expect(after).toHaveBeenCalledWith('s0', item, expect.any(AbortSignal))
    expect(item.status).toBe('uploading')
    expect(item.progress).toBe(1)
    expect(result.isUploading.value).toBe(true)
    expect(onItemSuccess).not.toHaveBeenCalled()

    finishing.resolve()
    await waitFor(() => item.status === 'success')
    expect(onItemSuccess).toHaveBeenCalledWith('s0', item)
    expect(result.isUploading.value).toBe(false)
  })

  it('tells a refusal from a failure: a ConvexError is refused, anything else failed', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const onItemError = vi.fn()
    const after = vi.fn()
      .mockRejectedValueOnce(new ConvexError({ code: 'too_many_photos' }))
      .mockRejectedValueOnce(new Error('network down'))

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef, { after, onItemError }))
    result.enqueue([new Blob(['a']), new Blob(['b'])])
    await waitFor(() => FakeXhr.instances.length === 2)
    FakeXhr.instances[0]!.resolveWith('s0')
    FakeXhr.instances[1]!.resolveWith('s1')
    await waitFor(() => !result.isUploading.value)

    const [refused, failed] = result.items.value
    expect(refused).toMatchObject({ status: 'error', refused: true, stage: null })
    expect(failed).toMatchObject({ status: 'error', refused: false, stage: null })
    expect(onItemError).toHaveBeenCalledTimes(2)
    // The refused file goes again on a retry; the failed one is still stored.
    expect(refused!.storageId).toBeNull()
    expect(failed!.storageId).toBe('s1')
  })

  it('lets isRefusal decide, prepare\'s throw included', async () => {
    class NotAPhoto extends Error {}
    const isRefusal = vi.fn((error: Error) => error instanceof NotAPhoto)

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef, {
      prepare: (file) => {
        if (file.size === 0) throw new NotAPhoto('That file is not a photo.')
        throw new Error('decoder crashed')
      },
      isRefusal,
    }))
    result.enqueue([new Blob([]), new Blob(['x'])])
    await waitFor(() => !result.isUploading.value)

    expect(result.items.value.map(item => [item.status, item.refused])).toEqual([['error', true], ['error', false]])
    expect(isRefusal).toHaveBeenCalledWith(expect.any(NotAPhoto), result.items.value[0])
    expect(FakeXhr.instances).toHaveLength(0)
  })

  it('retry runs only after again when the file is stored, and sends it again after a refusal', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const prepare = vi.fn((file: Blob) => file)
    const after = vi.fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockRejectedValueOnce(new ConvexError('refused'))
      .mockResolvedValue(undefined)
    const onComplete = vi.fn()

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef, { prepare, after, onComplete }))
    result.enqueue(new Blob(['a']))
    const item = result.items.value[0]!
    await waitFor(() => FakeXhr.instances.length === 1)
    FakeXhr.instances[0]!.resolveWith('s0')
    await waitFor(() => item.status === 'error')
    expect(item.refused).toBe(false)

    // A failure in after: no second transfer, the same storage id.
    result.retry(item.id)
    await waitFor(() => item.status === 'error' && item.refused)
    expect(after).toHaveBeenNthCalledWith(2, 's0', item, expect.any(AbortSignal))
    expect(FakeXhr.instances).toHaveLength(1)

    // A refusal in after: the file goes again; prepare does not run again.
    result.retry()
    await waitFor(() => FakeXhr.instances.length === 2)
    expect(item).toMatchObject({ status: 'uploading', error: null, refused: false, stage: 'upload' })
    FakeXhr.instances[1]!.resolveWith('s1')
    await waitFor(() => item.status === 'success')

    expect(item.storageId).toBe('s1')
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledTimes(3)
  })

  it('retry leaves items that did not fail alone', async () => {
    vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef))
    result.enqueue(new Blob(['a']))
    await waitFor(() => FakeXhr.instances.length === 1)
    FakeXhr.instances[0]!.resolveWith('s0')
    await waitFor(() => !result.isUploading.value)

    result.retry()
    result.retry(result.items.value[0]!.id)
    await nextTick()
    expect(result.items.value[0]!.status).toBe('success')
    expect(FakeXhr.instances).toHaveLength(1)
  })

  it('aborts prepare on remove, never refused, and never uploads', async () => {
    const mutation = vi.spyOn(client, 'mutation').mockResolvedValue(uploadUrl as never)
    const preparing = deferred<Blob>()
    let seen: AbortSignal | undefined
    const onItemError = vi.fn()

    const { result } = await mountWithConvex(client, () => useUploadQueue(genUrlRef, {
      prepare: (_file, _item, signal) => {
        seen = signal
        return preparing.promise
      },
      isRefusal: () => true,
      onItemError,
    }))
    result.enqueue(new Blob(['a']))
    const item = result.items.value[0]!
    result.remove(item.id)
    expect(seen?.aborted).toBe(true)

    preparing.resolve(new Blob(['ready']))
    await waitFor(() => onItemError.mock.calls.length === 1)
    expect(item.refused).toBe(false)
    expect(mutation).not.toHaveBeenCalled()
  })
})

describe('useStorageUrl', () => {
  const getUrlRef = makeFunctionReference<'query'>('files:getUrl')
  const seedRef = makeFunctionReference<'mutation'>('seed:storageUrl')

  beforeEach(() => {
    void client.mutation(seedRef, {}, {
      optimisticUpdate: (localStore) => {
        localStore.setQuery(getUrlRef, { storageId: 'store_1' }, 'https://cdn.example.com/x.png')
      },
    })
  })

  it('resolves the served URL for a storage id', async () => {
    const { result } = await mountWithConvex(
      client,
      () => useStorageUrl(getUrlRef, 'store_1'),
      { tick: true },
    )

    expect(result.value).toBe('https://cdn.example.com/x.png')
  })

  it('skips (returns undefined) when the storage id is null', async () => {
    const { result } = await mountWithConvex(
      client,
      () => useStorageUrl(getUrlRef, null),
    )

    expect(result.value).toBeUndefined()
  })
})
