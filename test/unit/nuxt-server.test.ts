import type { FunctionReference } from 'convex/server'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resetNuxtRuntimeConfigForTests, setNuxtRuntimeConfigForTests } from '../helpers/nuxt-imports'

// Hoist mock functions so they're available before vi.mock factory runs
const { mockClientUrls, mockQuery, mockMutation, mockAction, mockSetAuth, mockSetAdminAuth, mockSetFetchOptions } = vi.hoisted(() => ({
  mockClientUrls: [] as string[],
  mockQuery: vi.fn(),
  mockMutation: vi.fn(),
  mockAction: vi.fn(),
  mockSetAuth: vi.fn(),
  mockSetAdminAuth: vi.fn(),
  mockSetFetchOptions: vi.fn(),
}))

type MockConvexHttpClientInstance = {
  query: typeof mockQuery
  mutation: typeof mockMutation
  action: typeof mockAction
  setAuth: typeof mockSetAuth
  setAdminAuth: typeof mockSetAdminAuth
  setFetchOptions: typeof mockSetFetchOptions
}

type NamedFunctionReference<Type extends 'query' | 'mutation' | 'action'> = FunctionReference<Type> & {
  _name: string
}

function mockFunctionReference<Type extends 'query' | 'mutation' | 'action'>(
  name: string,
): NamedFunctionReference<Type> {
  return { _name: name } as unknown as NamedFunctionReference<Type>
}

vi.mock('convex/browser', () => ({
  ConvexHttpClient: function MockConvexHttpClient(this: MockConvexHttpClientInstance, url: string) {
    mockClientUrls.push(url)
    this.query = mockQuery
    this.mutation = mockMutation
    this.action = mockAction
    this.setAuth = mockSetAuth
    this.setAdminAuth = mockSetAdminAuth
    this.setFetchOptions = mockSetFetchOptions
  },
}))

vi.mock('convex/server', () => ({
  getFunctionName: vi.fn((ref: { _name?: string } | string) => typeof ref === 'string' ? ref : ref?._name ?? String(ref)),
  makeFunctionReference: vi.fn((name: string) => ({ _name: name })),
}))

vi.mock('convex/values', () => ({
  convexToJson: vi.fn(<T>(value: T) => JSON.parse(JSON.stringify(value)) as T),
  jsonToConvex: vi.fn(<T>(value: T) => value),
}))

describe('Nuxt server utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClientUrls.length = 0
    resetNuxtRuntimeConfigForTests()
    // Set env var
    process.env.NUXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud'
  })

  describe('fetchQuery', () => {
    it('calls ConvexHttpClient.query', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([{ text: 'Buy groceries' }])

      const result = await fetchQuery(queryRef, {})
      expect(mockQuery).toHaveBeenCalledWith(queryRef, {})
      expect(result).toEqual([{ text: 'Buy groceries' }])
    })

    it('passes auth token to client', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([])

      await fetchQuery(queryRef, {}, { token: 'my-jwt' })
      expect(mockSetAuth).toHaveBeenCalledWith('my-jwt')
    })

    it('uses custom URL if provided', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([])

      await fetchQuery(queryRef, {}, { url: 'https://custom.convex.cloud' })
      expect(mockClientUrls).toContain('https://custom.convex.cloud')
      expect(mockQuery).toHaveBeenCalled()
    })

    it('uses Nuxt runtime config when no env URL is set', async () => {
      delete process.env.NUXT_PUBLIC_CONVEX_URL
      setNuxtRuntimeConfigForTests({
        public: {
          convex: {
            url: 'https://runtime.convex.cloud',
          },
        },
      })

      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([])

      await fetchQuery(queryRef, {})
      expect(mockClientUrls).toContain('https://runtime.convex.cloud')
    })
  })

  describe('fetchMutation', () => {
    it('calls ConvexHttpClient.mutation', async () => {
      const { fetchMutation } = await import('../../src/runtime/nuxt/index')
      const mutationRef = mockFunctionReference<'mutation'>('api.tasks.create')
      mockMutation.mockResolvedValue({ _id: '123' })

      const result = await fetchMutation(mutationRef, { text: 'New task' })
      expect(mockMutation).toHaveBeenCalledWith(mutationRef, { text: 'New task' })
      expect(result).toEqual({ _id: '123' })
    })
  })

  describe('fetchAction', () => {
    it('calls ConvexHttpClient.action', async () => {
      const { fetchAction } = await import('../../src/runtime/nuxt/index')
      const actionRef = mockFunctionReference<'action'>('api.tasks.process')
      mockAction.mockResolvedValue({ ok: true })

      const result = await fetchAction(actionRef, { id: '123' })
      expect(mockAction).toHaveBeenCalledWith(actionRef, { id: '123' })
      expect(result).toEqual({ ok: true })
    })
  })

  // PARITY: D-17
  describe('function names on errors', () => {
    const calls = [
      ['fetchQuery', mockQuery, 'Q'],
      ['fetchMutation', mockMutation, 'M'],
      ['fetchAction', mockAction, 'A'],
    ] as const

    it.each(calls)('%s names the function in the error it rethrows, as the browser client does', async (helper, mock, prefix) => {
      const server = await import('../../src/runtime/nuxt/index')
      const thrown = Object.assign(new Error('[Request ID: 1] Server Error\nUncaught Error: boom'), { data: { code: 'refused' } })
      mock.mockRejectedValueOnce(thrown)

      const failure = await (server[helper] as (ref: unknown, args: object) => Promise<unknown>)(mockFunctionReference('tasks:list'), {}).catch((error: unknown) => error)

      // The same object: its class and `data` survive for whoever catches it.
      expect(failure).toBe(thrown)
      expect(thrown.message).toBe(`[CONVEX ${prefix}(tasks:list)] [Request ID: 1] Server Error\nUncaught Error: boom`)
      expect(thrown.data).toEqual({ code: 'refused' })
      expect(thrown.stack?.split('\n')[0]).toBe(`Error: [CONVEX ${prefix}(tasks:list)] [Request ID: 1] Server Error`)
    })

    it('rewrites the stack\'s header, not the first match of the message', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const thrown = new Error('Error')
      mockQuery.mockRejectedValueOnce(thrown)

      await expect(fetchQuery(mockFunctionReference<'query'>('tasks:list'), {})).rejects.toBe(thrown)
      expect(thrown.stack?.split('\n')[0]).toBe('Error: [CONVEX Q(tasks:list)] Error')
    })

    it('leaves an error that already names its function alone', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const thrown = new Error('[CONVEX Q(other:fn)] boom')
      mockQuery.mockRejectedValueOnce(thrown)

      await expect(fetchQuery(mockFunctionReference<'query'>('tasks:list'), {})).rejects.toBe(thrown)
      expect(thrown.message).toBe('[CONVEX Q(other:fn)] boom')
    })

    it('rethrows an error whose message cannot be written untouched', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      // A DOMException's message is a getter: assigning it throws in a module.
      const aborted = new DOMException('The operation was aborted.', 'AbortError')
      mockQuery.mockRejectedValueOnce(aborted)

      await expect(fetchQuery(mockFunctionReference<'query'>('tasks:list'), {})).rejects.toBe(aborted)
      expect(aborted.message).toBe('The operation was aborted.')
      expect(aborted.name).toBe('AbortError')
    })

    it('names the function on an error whose stack cannot be written, and rethrows that error', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const { withoutFunctionName } = await import('../../src/runtime/nuxt/function-name')
      const thrown = Object.defineProperty(new Error('boom'), 'stack', { value: 'Error: boom\n    at x', writable: false })
      mockQuery.mockRejectedValueOnce(thrown)

      await expect(fetchQuery(mockFunctionReference<'query'>('tasks:list'), {})).rejects.toBe(thrown)
      expect(thrown.message).toBe('[CONVEX Q(tasks:list)] boom')
      expect(thrown.stack).toBe('Error: boom\n    at x')
      expect(withoutFunctionName(thrown, error => (error as Error).message)).toBe('boom')
      expect(thrown.message).toBe('[CONVEX Q(tasks:list)] boom')
    })

    it('rethrows a value that is not an Error untouched', async () => {
      const { fetchAction } = await import('../../src/runtime/nuxt/index')
      mockAction.mockRejectedValueOnce('offline')

      await expect(fetchAction(mockFunctionReference<'action'>('tasks:run'), {})).rejects.toBe('offline')
    })
  })

  describe('preloadQuery', () => {
    it('returns a Preloaded payload with JSON-encoded value', async () => {
      const { preloadQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([{ text: 'Task 1' }])

      const preloaded = await preloadQuery(queryRef, {})
      expect(preloaded).toHaveProperty('_name')
      expect(preloaded).toHaveProperty('_argsJSON')
      expect(preloaded).toHaveProperty('_valueJSON')
    })
  })

  describe('preloadedQueryResult', () => {
    it('extracts the result from a Preloaded payload', async () => {
      const { preloadQuery, preloadedQueryResult } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([{ text: 'Task 1' }])

      const preloaded = await preloadQuery(queryRef, {})
      const result = preloadedQueryResult(preloaded)
      expect(result).toBeDefined()
    })
  })

  describe('client setup', () => {
    it('logs the deprecation error when url is explicitly undefined', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([])

      // Explicit `{ url: undefined }` (e.g. an unset env var spread in) still
      // works via the env fallback but must fire the deprecation warning.
      await fetchQuery(queryRef, {}, { url: undefined })

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('deploymentUrl is undefined'))
      expect(mockQuery).toHaveBeenCalled()
      errorSpy.mockRestore()
    })

    it('passes adminToken to the client via setAdminAuth', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([])

      await fetchQuery(queryRef, {}, { adminToken: 'admin-key' })

      expect(mockSetAdminAuth).toHaveBeenCalledWith('admin-key')
    })
  })

  describe('deployment URL validation', () => {
    it('rejects a URL that is not http(s)', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')

      await expect(fetchQuery(queryRef, {}, { url: 'ftp://x' }))
        .rejects.toThrow(/Must start with "https:\/\/" or "http:\/\/"/)
    })

    it('rejects a malformed URL', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')

      await expect(fetchQuery(queryRef, {}, { url: 'http://[' }))
        .rejects.toThrow(/is not a valid URL/)
    })

    it('rejects a .convex.site URL (HTTP Actions domain)', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')

      await expect(fetchQuery(queryRef, {}, { url: 'https://x.convex.site' }))
        .rejects.toThrow(/ends with \.convex\.site/)
    })

    it('skips validation when skipConvexDeploymentUrlCheck is set', async () => {
      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')
      mockQuery.mockResolvedValue([])

      await fetchQuery(queryRef, {}, { url: 'ftp://x', skipConvexDeploymentUrlCheck: true })

      expect(mockClientUrls).toContain('ftp://x')
    })
  })

  describe('error handling', () => {
    it('throws when no URL is available', async () => {
      delete process.env.NUXT_PUBLIC_CONVEX_URL

      // Re-import to get fresh module with no URL env vars
      vi.resetModules()

      const { fetchQuery } = await import('../../src/runtime/nuxt/index')
      const queryRef = mockFunctionReference<'query'>('api.tasks.list')

      await expect(fetchQuery(queryRef, {})).rejects.toThrow()
    })
  })

  // Kept last: it swaps the `#imports` mock and resets the module registry,
  // which would detach earlier tests from the shared nuxt-imports helper.
  describe('getConvexRuntimeConfig', () => {
    it('returns {} when useRuntimeConfig throws (outside a Nuxt context)', async () => {
      vi.resetModules()
      vi.doMock('#imports', () => ({
        useRuntimeConfig: () => {
          throw new Error('nuxt instance unavailable')
        },
      }))

      const { getConvexRuntimeConfig } = await import('../../src/runtime/nuxt/config')
      expect(getConvexRuntimeConfig()).toEqual({})

      vi.doUnmock('#imports')
      vi.resetModules()
    })
  })
})
