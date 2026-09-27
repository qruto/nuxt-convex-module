import { v, type Infer } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'

export const counterName = v.union(v.literal('clicks'), v.literal('posts'), v.literal('files'))

async function find(ctx: QueryCtx, name: Infer<typeof counterName>) {
  return await ctx.db
    .query('counters')
    .withIndex('by_name', q => q.eq('name', name))
    .unique()
}

/** Adds `amount` to a counter, creating it on first use. */
export async function bump(ctx: MutationCtx, name: Infer<typeof counterName>, amount: number) {
  const counter = await find(ctx, name)
  const value = (counter?.value ?? 0) + amount
  // `v.number()` also accepts NaN and Infinity, and two large numbers can add up
  // to Infinity. Any of them would stick in the shared total.
  if (!Number.isFinite(value)) throw new Error('A counter total must stay a finite number.')
  if (counter) {
    await ctx.db.patch('counters', counter._id, { value })
  }
  else {
    await ctx.db.insert('counters', { name, value })
  }
}

export const get = query({
  args: { name: counterName },
  handler: async (ctx, { name }) => {
    return (await find(ctx, name))?.value ?? 0
  },
})

export const add = mutation({
  args: { amount: v.number() },
  handler: async (ctx, { amount }) => {
    await bump(ctx, 'clicks', amount)
  },
})
