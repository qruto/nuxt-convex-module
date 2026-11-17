// PARITY: D-21
import { afterEach, describe, expect, it, vi } from 'vitest'
import { uploadWithProgress } from '../../src/runtime/r2/upstream/client/upload'

// The upload helper the R2 composable copies from `@convex-dev/r2`. Neither
// upstream nor `test/plain-vue/r2.test.ts`, which mocks it, runs it: here it
// runs against a stand-in `XMLHttpRequest`.

class FakeXhr {
  static last: FakeXhr
  method = ''
  url = ''
  headers: Record<string, string> = {}
  sent: unknown
  status = 0
  statusText = ''
  upload: { onprogress?: (event: { loaded: number, total: number }) => void } = {}
  onload?: () => void
  onerror?: () => void

  constructor() {
    FakeXhr.last = this
  }

  open(method: string, url: string) {
    this.method = method
    this.url = url
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value
  }

  send(body: unknown) {
    this.sent = body
  }

  respond(status: number, statusText = '') {
    this.status = status
    this.statusText = statusText
    this.onload?.()
  }
}

const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('uploadWithProgress', () => {
  it('PUTs the file to the signed URL with its content type, and reports progress', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    const onProgress = vi.fn()
    const done = uploadWithProgress('https://bucket.example/signed', file, onProgress)
    const xhr = FakeXhr.last

    expect(xhr.method).toBe('PUT')
    expect(xhr.url).toBe('https://bucket.example/signed')
    expect(xhr.headers).toEqual({ 'Content-Type': 'text/plain' })
    expect(xhr.sent).toBe(file)
    xhr.upload.onprogress!({ loaded: 2, total: 5 })
    expect(onProgress).toHaveBeenCalledWith({ loaded: 2, total: 5 })

    xhr.respond(200)
    await expect(done).resolves.toBeUndefined()
  })

  it('rejects a response outside 2xx with its status text', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    const done = uploadWithProgress('https://bucket.example/signed', file)
    FakeXhr.last.respond(403, 'Forbidden')
    await expect(done).rejects.toThrow('Failed to upload file: Forbidden')
  })

  it('rejects a network error', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    const done = uploadWithProgress('https://bucket.example/signed', file)
    FakeXhr.last.onerror!()
    await expect(done).rejects.toThrow('Failed to upload file')
  })
})
