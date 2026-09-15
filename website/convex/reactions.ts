import type { MutationCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { CITY, KINDS, checkName } from '../shared/reactions'
import { spend } from './gate'
import { rejectMessage } from './moderation'

// THE REACTIONS — the hero panel's instrument (2026-09-15, replacing the
// canvas, which lives on at /canvas). Four keys every visitor can press;
// a press is ONE ROW, appended and never patched, carrying the name the
// visitor sends as and, if they switched it on, their city. `board` is the
// whole readout in one subscription: the last rows for the ledger and
// today's count per key for the deck, one consistent snapshot.
//
// Shared-deployment guardrails: the table is public and unauthenticated.
// The only free text is the name, and it is a short lowercase word checked
// here against the same rule the client uses (shared/reactions.ts) plus the
// console's word filter; the city is a short place name. Writes ride a
// global per-minute budget, and every read is bounded because `send` keeps
// the table under a cap — the oldest rows go first.
const RECENT = 8
const MAX_ROWS = 400
const WINDOW_MS = 60_000
const GLOBAL_PER_WINDOW = 300

/** The UTC day a tally row is keyed on. */
const today = () => new Date().toISOString().slice(0, 10)

/** The readout: the latest rows, newest first, and today's count per key. */
export const board = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('reactions').order('desc').take(RECENT)
    const day = today()
    const tally = await Promise.all(KINDS.map(async (_, kind) => {
      const row = await ctx.db.query('reactionTally')
        .withIndex('by_day_and_kind', q => q.eq('day', day).eq('kind', kind))
        .unique()
      return row?.count ?? 0
    }))
    return {
      // The id is a plain string here: it is the ledger's row key, and the
      // optimistic row the client prints before the round trip has none.
      recent: rows.map(row => ({ id: String(row._id), at: row._creationTime, kind: row.kind, name: row.name, city: row.city ?? null })),
      tally,
    }
  },
})

// Keep the table under the cap: the oldest rows past it are dropped before
// the new one lands.
async function makeRoom(ctx: MutationCtx) {
  const rows = await ctx.db.query('reactions').take(MAX_ROWS + 50)
  for (const row of rows.slice(0, Math.max(0, rows.length - MAX_ROWS + 1))) await ctx.db.delete(row._id)
}

export const send = mutation({
  args: { kind: v.number(), name: v.string(), city: v.optional(v.string()) },
  handler: async (ctx, { kind, name, city }) => {
    if (!Number.isInteger(kind) || kind < 0 || kind >= KINDS.length) throw new ConvexError('No such key.')
    const reason = checkName(name) ?? rejectMessage(name, name)
    if (reason) throw new ConvexError(reason)
    if (city !== undefined && (!CITY.test(city) || rejectMessage(city, city))) throw new ConvexError('That city did not pass.')
    await spend(ctx, 'reactions.writes', GLOBAL_PER_WINDOW, WINDOW_MS,
      'The keys are cooling down — a lot of presses this minute. Try again in a moment.')
    await makeRoom(ctx)
    await ctx.db.insert('reactions', { kind, name, ...(city !== undefined ? { city } : {}) })
    const day = today()
    const tally = await ctx.db.query('reactionTally')
      .withIndex('by_day_and_kind', q => q.eq('day', day).eq('kind', kind))
      .unique()
    if (tally) await ctx.db.patch(tally._id, { count: tally.count + 1 })
    else await ctx.db.insert('reactionTally', { day, kind, count: 1 })
  },
})
