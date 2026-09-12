import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Who is on the landing page right now. A session heartbeats while the page
// is visible; `count` reads the rows fresher than the window; a cron sweeps
// the rest. No identity, no free text — a session id the browser minted.
//
// Shared-deployment guardrails: one row per session (upsert, never insert
// twice), a short window so the table stays a few rows deep, and an
// alphanumeric session id so nothing arbitrary lands in the table.
const WINDOW_MS = 45_000
const SID = /^[a-z0-9]{6,24}$/
const MAX_ROWS = 500

export const heartbeat = mutation({
  args: { sid: v.string() },
  handler: async (ctx, { sid }) => {
    if (!SID.test(sid)) return
    const now = Date.now()
    const existing = await ctx.db.query('presence').withIndex('by_sid', q => q.eq('sid', sid)).unique()
    if (existing) {
      await ctx.db.patch(existing._id, { at: now })
      return
    }
    // A hard cap so a scripted client cannot grow the table without bound;
    // the sweep frees rows again within minutes.
    const live = await ctx.db.query('presence').withIndex('by_at', q => q.gt('at', now - WINDOW_MS)).take(MAX_ROWS)
    if (live.length >= MAX_ROWS) return
    await ctx.db.insert('presence', { sid, at: now })
  },
})

export const count = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - WINDOW_MS
    const live = await ctx.db.query('presence').withIndex('by_at', q => q.gt('at', cutoff)).take(MAX_ROWS)
    return live.length
  },
})

// Cron: drop sessions that stopped heartbeating. Bounded per pass; the
// interval is short enough that a pass never has more than a batch to do.
export const sweep = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - WINDOW_MS * 2
    const stale = await ctx.db.query('presence').withIndex('by_at', q => q.lt('at', cutoff)).take(MAX_ROWS)
    await Promise.all(stale.map(row => ctx.db.delete(row._id)))
  },
})
