import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { makeFunctionReference } from 'convex/server'
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
