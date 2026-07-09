import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getConvexAliases } from '../../src/module'

// resolveFunctionsDir falls back to the standard `convex/` dir when no
// convex.json exists, so an empty root keeps this test pure.
const rootDir = '/tmp/nuxt-convex-module-alias-fixture'
const generatedDir = join(rootDir, 'convex', '_generated')

describe('Convex import aliases', () => {
  it('maps the Convex generated modules to their _generated files', () => {
    const aliases = getConvexAliases(rootDir)

    expect(aliases).toEqual({
      '#convex/api': join(generatedDir, 'api'),
      '#convex/server': join(generatedDir, 'server'),
      '#convex/dataModel': join(generatedDir, 'dataModel'),
      '#convex/_generated': generatedDir,
      '#convex': join(rootDir, 'convex'),
    })
  })

  it('orders specific aliases before the catch-all #convex', () => {
    // @rollup/plugin-alias (Vite + Nitro) is first-match-wins and treats
    // `#convex` as a prefix of `#convex/api`, so the specific generated-module
    // aliases must precede `#convex` or they would never win.
    const keys = Object.keys(getConvexAliases(rootDir))
    const catchAll = keys.indexOf('#convex')

    expect(catchAll).toBe(keys.length - 1)
    for (const specific of ['#convex/api', '#convex/server', '#convex/dataModel', '#convex/_generated']) {
      expect(keys.indexOf(specific)).toBeLessThan(catchAll)
    }
  })
})
