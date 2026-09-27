import { v } from 'convex/values'
import { internal } from './_generated/api'
import { action, internalMutation } from './_generated/server'
import { insertPost } from './posts'

// An action runs outside the database transaction, so it is where
// nondeterministic work belongs: calling a third-party API, or here, rolling a
// die. It has no `ctx.db`, so it records the result through a mutation.
export const roll = action({
  args: {},
  handler: async (ctx): Promise<number> => {
    const value = 1 + Math.floor(Math.random() * 6)
    await ctx.runMutation(internal.dice.record, { value })
    return value
  },
})

export const record = internalMutation({
  args: { value: v.number() },
  handler: async (ctx, { value }) => {
    await insertPost(ctx, '🎲', `rolled ${value}`)
  },
})
