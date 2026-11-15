import type { ClientApi } from '@convex-dev/r2'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import { uploadWithProgress } from '../../src/runtime/r2/upstream/client/upload'
import { useUploadFile } from '../../src/runtime/r2/vue/index'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

// The Vue counterpart of upstream's `src/vue/index.test.ts`, scenario for
// scenario. Upstream mocks `convex-vue`'s client; here the client is provided
// as the module provides it.

const mockMutation = vi.fn()
const mockClient = { mutation: mockMutation } as unknown as ConvexVueClient

vi.mock('../../src/runtime/r2/upstream/client/upload', () => ({
  uploadWithProgress: vi.fn(),
}))

const mockApi = {
  generateUploadUrl: 'generateUploadUrl' as unknown,
  syncMetadata: 'syncMetadata' as unknown,
} as Pick<ClientApi, 'generateUploadUrl' | 'syncMetadata'>

function mountUpload() {
  const result = {} as { upload: ReturnType<typeof useUploadFile> }
  const Child = defineComponent({
    setup() {
      result.upload = useUploadFile(mockApi)
      return () => null
    },
  })
  mount(defineComponent({
    setup() {
      provide(ConvexClientKey, mockClient)
      return () => h(Child)
    },
  }))
  return result.upload
}

describe('vue useUploadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls generateUploadUrl, uploads, and syncs metadata', async () => {
    const url = 'https://upload.example.com'
    const key = 'file-key-123'
    mockMutation.mockResolvedValueOnce({ url, key })
    mockMutation.mockResolvedValueOnce(undefined)

    const upload = mountUpload()
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const result = await upload(file)

    expect(mockMutation).toHaveBeenCalledWith(mockApi.generateUploadUrl, {})
    expect(uploadWithProgress).toHaveBeenCalledWith(url, file, undefined)
    expect(mockMutation).toHaveBeenCalledWith(mockApi.syncMetadata, { key })
    expect(result).toBe(key)
  })

  it('forwards progress callback to uploadWithProgress', async () => {
    const url = 'https://upload.example.com'
    const key = 'file-key-456'
    mockMutation.mockResolvedValueOnce({ url, key })
    mockMutation.mockResolvedValueOnce(undefined)

    const upload = mountUpload()
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const onProgress = vi.fn()
    await upload(file, { onProgress })

    expect(uploadWithProgress).toHaveBeenCalledWith(url, file, onProgress)
  })

  // Upstream's `convex-vue` throws its own error without a client.
  it('needs a Convex client above it', () => {
    expect(() => mount(defineComponent({
      setup() {
        useUploadFile(mockApi)
        return () => null
      },
    }))).toThrow('Could not find Convex client! `useUploadFile`')
  })
})
