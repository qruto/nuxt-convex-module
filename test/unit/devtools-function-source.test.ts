import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { resolveFunctionSource } from '../../src/devtools/resolve-function-source'

const rootDir = mkdtempSync(join(tmpdir(), 'nuxt-convex-fn-source-'))
const functionsDir = 'convex'
const base = join(rootDir, functionsDir)

mkdirSync(join(base, 'chat'), { recursive: true })
writeFileSync(join(base, 'messages.ts'), '')
writeFileSync(join(base, 'legacy.js'), '')
writeFileSync(join(base, 'chat', 'index.ts'), '')

afterAll(() => rmSync(rootDir, { recursive: true, force: true }))

describe('resolveFunctionSource', () => {
  it('maps a udfPath to its module file, ignoring the function name', () => {
    expect(resolveFunctionSource(rootDir, functionsDir, 'messages:list'))
      .toEqual({ filepath: join(base, 'messages.ts') })
    expect(resolveFunctionSource(rootDir, functionsDir, 'messages:default'))
      .toEqual({ filepath: join(base, 'messages.ts') })
  })

  it('falls back through extensions and index files', () => {
    expect(resolveFunctionSource(rootDir, functionsDir, 'legacy:run'))
      .toEqual({ filepath: join(base, 'legacy.js') })
    expect(resolveFunctionSource(rootDir, functionsDir, 'chat:send'))
      .toEqual({ filepath: join(base, 'chat', 'index.ts') })
  })

  it('returns {} for unknown modules', () => {
    expect(resolveFunctionSource(rootDir, functionsDir, 'nope:list')).toEqual({})
  })

  it('rejects path traversal and degenerate paths', () => {
    expect(resolveFunctionSource(rootDir, functionsDir, '../secrets:read')).toEqual({})
    expect(resolveFunctionSource(rootDir, functionsDir, 'chat/../../secrets:read')).toEqual({})
    expect(resolveFunctionSource(rootDir, functionsDir, ':list')).toEqual({})
    expect(resolveFunctionSource(rootDir, functionsDir, '')).toEqual({})
  })
})
