'use node'
import { action } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { createHash } from 'node:crypto'
import { admit } from './gate'

// Server-side text analysis — powers the `useAction` playground demo. Runs in
// the Node.js action runtime (something a query/mutation can't do).
//
// Shared-deployment guardrails: every call bills Node time, so the input is
// capped and each visitor gets a small bucket (gate.ts).
const MAX_INPUT_LENGTH = 2_000

export const text = action({
  args: { input: v.string() },
  handler: async (ctx, { input }) => {
    if (input.length > MAX_INPUT_LENGTH) {
      throw new ConvexError(`Text must be at most ${MAX_INPUT_LENGTH.toLocaleString('en')} characters.`)
    }
    await admit(ctx, 'analyze')

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
