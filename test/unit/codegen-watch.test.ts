import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// The module promises that codegen landing re-renders the guarded templates
// without a restart. That only works if Nuxt's watcher covers the generated
// directory — and in a Nuxt 4 layout (`app/` as srcDir) a root-level `convex/`
// is not covered unless the module asks for it.

const updateTemplates = vi.fn(async (_options: { filter: (template: { filename: string }) => boolean }) => {})
vi.mock('@nuxt/kit', async importOriginal => ({ ...(await importOriginal<typeof import('@nuxt/kit')>()), updateTemplates }))

const { watchConvexCodegen, CODEGEN_GUARDED_TEMPLATES } = await import('../../src/codegen-watch')

const rootDir = mkdtempSync(join(tmpdir(), 'convex-codegen-watch-'))
afterAll(() => rmSync(rootDir, { recursive: true, force: true }))

type Handler = (event: string, path: string) => Promise<void>
const fakeNuxt = (dev = true) => {
  const hooks: Record<string, Handler> = {}
  return {
    nuxt: {
      options: { dev, rootDir, watch: [] as string[] },
      hook: (name: string, handler: Handler) => { hooks[name] = handler },
    } as never,
    hooks,
  }
}

describe('watchConvexCodegen', () => {
  beforeEach(() => {
    updateTemplates.mockClear()
    rmSync(join(rootDir, 'convex.json'), { force: true })
  })

  it('adds the generated directory to nuxt.options.watch, once', () => {
    const { nuxt } = fakeNuxt()
    watchConvexCodegen(nuxt)
    watchConvexCodegen(nuxt)
    expect((nuxt as { options: { watch: string[] } }).options.watch).toEqual([join(rootDir, 'convex', '_generated')])
  })

  it('follows the functions directory from convex.json', () => {
    writeFileSync(join(rootDir, 'convex.json'), JSON.stringify({ functions: 'src/functions' }))
    const { nuxt } = fakeNuxt()
    watchConvexCodegen(nuxt)
    expect((nuxt as { options: { watch: string[] } }).options.watch).toEqual([join(rootDir, 'src', 'functions', '_generated')])
  })

  it('does nothing outside dev', () => {
    const { nuxt, hooks } = fakeNuxt(false)
    watchConvexCodegen(nuxt)
    expect((nuxt as { options: { watch: string[] } }).options.watch).toEqual([])
    expect(hooks['builder:watch']).toBeUndefined()
  })

  it('re-renders exactly the guarded templates when _generated/api changes', async () => {
    const { nuxt, hooks } = fakeNuxt()
    watchConvexCodegen(nuxt)
    await hooks['builder:watch']!('change', join(rootDir, 'convex', '_generated', 'api.js'))
    expect(updateTemplates).toHaveBeenCalledTimes(1)
    const { filter } = updateTemplates.mock.calls[0]![0]
    expect(CODEGEN_GUARDED_TEMPLATES.every(filename => filter({ filename }))).toBe(true)
    expect(filter({ filename: 'types/other.d.ts' })).toBe(false)

    await hooks['builder:watch']!('change', join(rootDir, 'convex', 'messages.ts'))
    expect(updateTemplates).toHaveBeenCalledTimes(1)
  })
})
