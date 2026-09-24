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
  if (counter) {
    await ctx.db.patch('counters', counter._id, { value: counter.value + amount })
  }
  else {
    await ctx.db.insert('counters', { name, value: amount })
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
