import { describe, expect, it } from 'vitest'
import { convexTypeFallbackContents } from '../../src/module'

describe('convexTypeFallbackContents', () => {
  it('declares placeholder #convex modules while codegen is absent', () => {
    const contents = convexTypeFallbackContents(false, 'convex')

    expect(contents).toContain('declare module \'#convex/api\'')
    expect(contents).toContain('declare module \'#convex/server\'')
    expect(contents).toContain('declare module \'#convex/dataModel\'')
    // The pointer names the actual functions dir so the hint is copy-pasteable.
    expect(contents).toContain('convex/_generated')
    // Id stays string-shaped: document ids are strings at runtime and the
    // placeholder should not silently accept e.g. numbers.
    expect(contents).toContain('export type Id<TableName extends string = string> = string')
  })

  it('reflects a non-default functions dir in the hint', () => {
    expect(convexTypeFallbackContents(false, 'functions')).toContain('functions/_generated')
  })

  it('declares nothing once codegen exists, so generated types win', () => {
    expect(convexTypeFallbackContents(true, 'convex')).toBe('export {}\n')
  })
})
