import type { MutationCtx } from './_generated/server'
import { internal } from './_generated/api'
import { internalMutation, mutation, query } from './_generated/server'
import { LIMITS, rejectMessage } from './moderation'
import { ConvexError, v } from 'convex/values'

// Live chat — powers the `useQuery` / `useMutation` playground demos AND the
// live hero panel on the marketing homepage.

// Shared-deployment guardrails: the chat is public and unauthenticated, and
// its rows are on the homepage, so every write goes through `rejectMessage`
// (length, links, profanity — see ./moderation) and `send` evicts the oldest
// messages beyond the cap, keeping every full-table read below Convex's
// per-query limits.
const MAX_MESSAGES = 100
const CLEAR_BATCH = 500

// Frequency guardrails — same spirit as ./moderation, but about rate rather
// than content. The bounded newest-slice read that `send` already does for
// eviction doubles as the rate window (`_creationTime` is on every row), so
// there is no limiter table, no component, and no extra index. Convex
// serializes mutations, so the checks are race-free. The GLOBAL ceiling is
// the real defense (a scripted client can mint fresh author names at will);
// the per-name limits are fairness for honest visitors, and some playground
// demos share a fixed name (`ssr-demo`, blank → `anonymous`), so their
// wording must read naturally for a shared name.
const WINDOW_MS = 60_000
const GLOBAL_PER_WINDOW = 20
const AUTHOR_PER_WINDOW = 6
const CLEAR_COOLDOWN_MS = 60_000

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
    // Content first — it's pure JS on the args, so a rejected message costs
    // no reads at all. `ConvexError`, not a plain `Error`: only ConvexError's
    // payload reaches the client on a production deployment (plain messages
    // are redacted), and the demo panels show the reason, not a bare
    // "rejected".
    const rejection = rejectMessage(author, body)
    if (rejection) {
      throw new ConvexError(rejection)
    }

    const trimmedAuthor = author.trim().slice(0, LIMITS.author) || 'Anonymous'
    const trimmedBody = body.trim()

    // One bounded read powers the rate windows AND the eviction below.
    const newest = await ctx.db.query('messages').order('desc').take(MAX_MESSAGES + 25)
    const cutoff = Date.now() - WINDOW_MS
    const recent = newest.filter(message => message._creationTime > cutoff)
    if (recent.length >= GLOBAL_PER_WINDOW) {
      throw new ConvexError('The table is cooling down — a lot of writes this minute. Try again in a moment.')
    }
    const sameName = recent.filter(message => message.author === trimmedAuthor)
    if (sameName.some(message => message.body === trimmedBody)) {
      throw new ConvexError('The table already has that exact message from this name within the last minute.')
    }
    if (sameName.length >= AUTHOR_PER_WINDOW) {
      throw new ConvexError('This name is writing fast — a few messages per minute per name keeps the table readable.')
    }

    await ctx.db.insert('messages', { author: trimmedAuthor, body: trimmedBody })
    // Keep the demo table bounded: the new row takes one slot, so everything
    // from index MAX-1 of the pre-insert list is beyond the cap.
    for (const message of newest.slice(MAX_MESSAGES - 1)) {
      await ctx.db.delete(message._id)
    }
  },
})

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    // A public wipe is as good a griefing tool as spam, so it rides a global
    // cooldown: one reset a minute, tracked in `meta`. The batched deletion
    // continues through an INTERNAL mutation — the continuation must not hit
    // this gate (or a >500-row flood could never finish clearing).
    const gate = await ctx.db
      .query('meta')
      .withIndex('by_key', q => q.eq('key', 'messages.clear'))
      .unique()
    const now = Date.now()
    if (gate && now - gate.at < CLEAR_COOLDOWN_MS) {
      throw new ConvexError('The table was reset less than a minute ago — give it a moment.')
    }
    if (gate) {
      await ctx.db.patch(gate._id, { at: now })
    }
    else {
      await ctx.db.insert('meta', { key: 'messages.clear', at: now })
    }
    await clearBatchHandler(ctx)
  },
})

export const clearBatch = internalMutation({
  args: {},
  handler: clearBatchHandler,
})

// Delete in bounded batches and reschedule the remainder, so the reset keeps
// working even if the table was ever flooded past what a single transaction
// can read or write.
async function clearBatchHandler(ctx: MutationCtx) {
  const batch = await ctx.db.query('messages').take(CLEAR_BATCH)
  await Promise.all(batch.map(message => ctx.db.delete(message._id)))
  if (batch.length === CLEAR_BATCH) {
    await ctx.scheduler.runAfter(0, internal.messages.clearBatch, {})
  }
}
