import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'

// The console's two other instruments, beside the switch bank: a level
// fader whose value is one shared number, and a pulse counter every visitor
// adds to. Both are a row in `console`, patched in place, read live.
//
// Shared-deployment guardrails: values are clamped, and both mutations ride
// the same global per-minute budget the switches use (a `meta` row holding
// the window's start and its count).
const KEYS = ['level', 'pulses'] as const
type Key = typeof KEYS[number]
const WINDOW_MS = 60_000
const GLOBAL_PER_WINDOW = 240

export const read = query({
  args: {},
  handler: async (ctx): Promise<Record<Key, number>> => {
    const rows = await ctx.db.query('console').take(KEYS.length * 2)
    const byKey = new Map(rows.map(row => [row.key, row.value]))
    return { level: byKey.get('level') ?? 40, pulses: byKey.get('pulses') ?? 0 }
  },
})

async function spend(ctx: { db: import('./_generated/server').DatabaseWriter }) {
  const now = Date.now()
  const gate = await ctx.db.query('meta').withIndex('by_key', q => q.eq('key', 'console.writes')).unique()
  const inWindow = gate !== null && now - gate.at < WINDOW_MS
  const used = inWindow ? (gate.count ?? 0) : 0
  if (used >= GLOBAL_PER_WINDOW) {
    throw new ConvexError('The console is cooling down — a lot of hands on it this minute. Try again in a moment.')
  }
  if (gate === null) await ctx.db.insert('meta', { key: 'console.writes', at: now, count: 1 })
  else if (inWindow) await ctx.db.patch(gate._id, { count: used + 1 })
  else await ctx.db.patch(gate._id, { at: now, count: 1 })
  return now
}

async function write(ctx: { db: import('./_generated/server').DatabaseWriter }, key: Key, value: number, now: number) {
  const row = await ctx.db.query('console').withIndex('by_key', q => q.eq('key', key)).unique()
  if (row) await ctx.db.patch(row._id, { value, at: now })
  else await ctx.db.insert('console', { key, value, at: now })
}

export const setLevel = mutation({
  args: { value: v.number() },
  handler: async (ctx, { value }) => {
    if (!Number.isFinite(value)) throw new ConvexError('Bad level.')
    const now = await spend(ctx)
    await write(ctx, 'level', Math.round(Math.min(100, Math.max(0, value))), now)
  },
})

export const pulse = mutation({
  args: {},
  handler: async (ctx) => {
    const now = await spend(ctx)
    const row = await ctx.db.query('console').withIndex('by_key', q => q.eq('key', 'pulses')).unique()
    await write(ctx, 'pulses', (row?.value ?? 0) + 1, now)
  },
})
