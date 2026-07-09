import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

// functions-dir.ts creates its scoped logger at module evaluation, so the
// mock has to be in place before the import below.
const warn = vi.hoisted(() => vi.fn())
vi.mock('@nuxt/kit', () => ({ useLogger: () => ({ warn }) }))

const { resolveFunctionsDir } = await import('../../src/functions-dir')

const base = mkdtempSync(join(tmpdir(), 'convex-functions-dir-'))
afterAll(() => rmSync(base, { recursive: true, force: true }))

let caseId = 0
/** A fresh empty project root per test so fixtures don't bleed between cases. */
function makeRoot(): string {
  const root = join(base, `case-${++caseId}`)
  mkdirSync(root, { recursive: true })
  return root
}

beforeEach(() => {
  warn.mockClear()
})

describe('resolveFunctionsDir', () => {
  it('normalizes the functions field from convex.json (leading ./ and trailing slash)', () => {
    const root = makeRoot()
    writeFileSync(join(root, 'convex.json'), JSON.stringify({ functions: './src/functions/' }))

    expect(resolveFunctionsDir(root)).toBe('src/functions')
  })

  it('falls back to the default and warns on malformed convex.json', () => {
    const root = makeRoot()
    writeFileSync(join(root, 'convex.json'), '{ not json')

    expect(resolveFunctionsDir(root)).toBe('convex')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Failed to parse convex.json'))
  })

  it('ignores a non-string functions field', () => {
    const root = makeRoot()
    writeFileSync(join(root, 'convex.json'), JSON.stringify({ functions: 123 }))

    expect(resolveFunctionsDir(root)).toBe('convex')
    expect(warn).not.toHaveBeenCalled()
  })

  it('defaults to convex/ when no convex.json exists', () => {
    const root = makeRoot()

    expect(resolveFunctionsDir(root)).toBe('convex')
  })
})
