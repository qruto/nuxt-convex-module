import { api } from './_generated/api'
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Live chat — powers the `useQuery` / `useMutation` playground demos.

// Shared-deployment guardrails: the chat is public and unauthenticated, so
// inputs are length-capped and `send` evicts the oldest messages beyond the
// cap, keeping every full-table read below Convex's per-query limits.
const MAX_MESSAGES = 100
const MAX_BODY_LENGTH = 500
const MAX_AUTHOR_LENGTH = 60
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
    const trimmedBody = body.trim()
    if (trimmedBody === '') {
      throw new Error('Message body must not be empty.')
    }
    if (trimmedBody.length > MAX_BODY_LENGTH) {
      throw new Error(`Message body must be at most ${MAX_BODY_LENGTH} characters.`)
    }
    await ctx.db.insert('messages', {
      author: author.trim().slice(0, MAX_AUTHOR_LENGTH) || 'Anonymous',
      body: trimmedBody,
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
