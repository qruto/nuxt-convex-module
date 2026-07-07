'use node'
import { action } from './_generated/server'
import { v } from 'convex/values'
import { createHash } from 'node:crypto'

// Server-side text analysis — powers the `useAction` playground demo. Runs in
// the Node.js action runtime (something a query/mutation can't do).

export const text = action({
  args: { input: v.string() },
  handler: async (_ctx, { input }) => {
    // Simulate real work so the demo's pending state is visible.
    await new Promise(resolve => setTimeout(resolve, 600))

    const words = input.trim() === '' ? [] : input.trim().split(/\s+/)
    return {
      characters: input.length,
      words: words.length,
      longestWord: words.reduce((longest, word) => word.length > longest.length ? word : longest, ''),
      sha256: createHash('sha256').update(input).digest('hex'),
      analyzedAt: Date.now(),
    }
  },
})
