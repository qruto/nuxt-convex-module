import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query, type MutationCtx } from './_generated/server'
import { bump } from './counters'

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db.query('posts').order('desc').paginate(paginationOpts)
  },
})

/** Inserts a post and counts it. Also used by `dice.record`. */
export async function insertPost(ctx: MutationCtx, emoji: string, text: string) {
  await ctx.db.insert('posts', { emoji: emoji.slice(0, 8), text: text.slice(0, 80) })
  await bump(ctx, 'posts', 1)
}

export const send = mutation({
  args: { emoji: v.string(), text: v.string() },
  handler: async (ctx, { emoji, text }) => {
    await insertPost(ctx, emoji, text)
  },
})
