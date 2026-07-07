import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Live chat — powers the `useQuery` / `useMutation` playground demos.

export const list = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query('messages').order('desc').take(50)
    return messages.reverse()
  },
})

export const count = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query('messages').collect()
    return messages.length
  },
})

export const send = mutation({
  args: { author: v.string(), body: v.string() },
  handler: async (ctx, { author, body }) => {
    if (body.trim() === '') {
      throw new Error('Message body must not be empty.')
    }
    await ctx.db.insert('messages', { author, body: body.trim() })
  },
})

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query('messages').collect()
    await Promise.all(messages.map(message => ctx.db.delete(message._id)))
  },
})
