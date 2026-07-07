import { describe, expect, it } from 'vitest'
import { backendTypeFallbackContents } from '../../src/module'

describe('backendTypeFallbackContents', () => {
  it('declares placeholder #backend modules while codegen is absent', () => {
    const contents = backendTypeFallbackContents(false, 'convex')

    expect(contents).toContain('declare module \'#backend/api\'')
    expect(contents).toContain('declare module \'#backend/server\'')
    expect(contents).toContain('declare module \'#backend/dataModel\'')
    // The pointer names the actual functions dir so the hint is copy-pasteable.
    expect(contents).toContain('convex/_generated')
    // Id stays string-shaped: document ids are strings at runtime and the
    // placeholder should not silently accept e.g. numbers.
    expect(contents).toContain('export type Id<TableName extends string = string> = string')
  })

  it('reflects a non-default functions dir in the hint', () => {
    expect(backendTypeFallbackContents(false, 'backend')).toContain('backend/_generated')
  })

  it('declares nothing once codegen exists, so generated types win', () => {
    expect(backendTypeFallbackContents(true, 'convex')).toBe('export {}\n')
  })
})
