// PARITY: D-01
// `import.meta.server` is truthy in this project. Upstream's effects only run
// in the browser, so a server render never sends the stream request.
import { describe, expect, it, vi } from 'vitest'
import { computed, effectScope } from 'vue'
import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { useStream } from '../../src/runtime/persistent-text-streaming/vue/index'

vi.mock('../../src/runtime/vue/composables/use-query', () => ({
  useQuery: () => computed(() => undefined),
}))

describe('useStream during a server render', () => {
  it('sends no request and renders the pending state', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const scope = effectScope()
    const stream = scope.run(() =>
      useStream({} as Parameters<typeof useStream>[0], new URL('https://example.convex.site/chat-stream'), true, 'a' as StreamId),
    )!

    expect(stream.value).toEqual({ text: '', status: 'pending' })
    expect(fetch).not.toHaveBeenCalled()
    scope.stop()
    vi.unstubAllGlobals()
  })
})
