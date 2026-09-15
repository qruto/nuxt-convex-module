import type { MutationCtx } from './_generated/server'
import { ConvexError } from 'convex/values'

// The two timestamp gates every public instrument on the landing page rides,
// each one row in `meta` keyed by the operation it guards. Convex serialises
// mutations, so both are race-free without any locking — and a throw later
// in the same mutation rolls the row back, so a gate can be spent before the
// work it admits.

/**
 * Spend one write from a global per-window budget: the row holds the
 * window's start and the writes counted inside it. Throws `message` once
 * the window is full; returns the timestamp the write was stamped with.
 */
export async function spend(ctx: MutationCtx, key: string, limit: number, windowMs: number, message: string) {
  const now = Date.now()
  const gate = await ctx.db.query('meta').withIndex('by_key', q => q.eq('key', key)).unique()
  const inWindow = gate !== null && now - gate.at < windowMs
  const used = inWindow ? (gate.count ?? 0) : 0
  if (used >= limit) throw new ConvexError(message)
  if (gate === null) await ctx.db.insert('meta', { key, at: now, count: 1 })
  else if (inWindow) await ctx.db.patch(gate._id, { count: used + 1 })
  else await ctx.db.patch(gate._id, { at: now, count: 1 })
  return now
}

/**
 * Trip a cooldown: the row holds when the operation last ran. Throws
 * `message` while the cooldown is still running, else restamps the row and
 * returns the new timestamp. A public wipe is as good a griefing tool as
 * spam, which is what these guard.
 */
export async function cooldown(ctx: MutationCtx, key: string, ms: number, message: string) {
  const now = Date.now()
  const gate = await ctx.db.query('meta').withIndex('by_key', q => q.eq('key', key)).unique()
  if (gate && now - gate.at < ms) throw new ConvexError(message)
  if (gate) await ctx.db.patch(gate._id, { at: now })
  else await ctx.db.insert('meta', { key, at: now })
  return now
}
