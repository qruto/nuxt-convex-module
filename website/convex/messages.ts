import { api } from './_generated/api'
import { mutation, query } from './_generated/server'
import { LIMITS, rejectMessage } from './moderation'
import { ConvexError, v } from 'convex/values'

// Live chat — powers the `useQuery` / `useMutation` playground demos AND the
// two live panels on the marketing homepage.

// Shared-deployment guardrails: the chat is public and unauthenticated, and
// its rows are on the homepage, so every write goes through `rejectMessage`
// (length, links, profanity — see ./moderation) and `send` evicts the oldest
// messages beyond the cap, keeping every full-table read below Convex's
// per-query limits.
const MAX_MESSAGES = 100
const CLEAR_BATCH = 500

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
    // Bounded read — `send` caps the table, so this sees every message.
    const messages = await ctx.db.query('messages').take(MAX_MESSAGES + 25)
    return messages.length
  },
})

export const send = mutation({
  args: { author: v.string(), body: v.string() },
  handler: async (ctx, { author, body }) => {
    const rejection = rejectMessage(author, body)
    if (rejection) {
      // `ConvexError`, not a plain `Error`: only ConvexError's payload reaches
      // the client on a production deployment (plain messages are redacted),
      // and the demo panels show the reason rather than a bare "rejected".
      throw new ConvexError(rejection)
    }
    await ctx.db.insert('messages', {
      author: author.trim().slice(0, LIMITS.author) || 'Anonymous',
      body: body.trim(),
    })
    // Keep the demo table bounded: evict the oldest messages beyond the cap.
    const newest = await ctx.db.query('messages').order('desc').take(MAX_MESSAGES + 25)
    for (const message of newest.slice(MAX_MESSAGES)) {
      await ctx.db.delete(message._id)
    }
  },
})

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete in bounded batches and reschedule the remainder, so the reset
    // button keeps working even if the table was ever flooded past what a
    // single transaction can read or write.
    const batch = await ctx.db.query('messages').take(CLEAR_BATCH)
    await Promise.all(batch.map(message => ctx.db.delete(message._id)))
    if (batch.length === CLEAR_BATCH) {
      await ctx.scheduler.runAfter(0, api.messages.clear, {})
    }
  },
})
