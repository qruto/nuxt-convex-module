// PARITY: A-09
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { watchConvexCodegen } from '../../src/codegen-watch'

// The module promises that codegen landing re-renders the fallback type
// template without a restart (its `dependsOn` is pinned in
// test/module/registration.test.ts). That only works if Nuxt's watcher covers
// the generated directory — and in a Nuxt 4 layout (`app/` as srcDir) a
// root-level `convex/` is not covered unless the module asks for it.

const rootDir = mkdtempSync(join(tmpdir(), 'convex-codegen-watch-'))
afterAll(() => rmSync(rootDir, { recursive: true, force: true }))

const fakeNuxt = (dev = true) => ({
  nuxt: { options: { dev, rootDir, watch: [] as string[] } } as never,
})

describe('watchConvexCodegen', () => {
  beforeEach(() => {
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
    const { nuxt } = fakeNuxt(false)
    watchConvexCodegen(nuxt)
    expect((nuxt as { options: { watch: string[] } }).options.watch).toEqual([])
  })
})
