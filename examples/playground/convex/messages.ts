import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/** Newest messages kept — this is a scratch playground, not storage. */
const KEEP = 50

export const list = query({
  args: {},
  handler: async (ctx) => {
    // `.order('desc').take(KEEP)` reads the newest KEEP rows without scanning
    // the table; reverse so the UI renders oldest-first.
    const newest = await ctx.db.query('messages').order('desc').take(KEEP)
    return newest.reverse()
  },
})

export const send = mutation({
  args: { author: v.string(), body: v.string() },
  handler: async (ctx, { author, body }) => {
    await ctx.db.insert('messages', {
      author: author.trim().slice(0, 40) || 'anonymous',
      body: body.trim().slice(0, 500),
    })
  },
})

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    for (const message of await ctx.db.query('messages').collect()) {
      await ctx.db.delete(message._id)
    }
  },
})
