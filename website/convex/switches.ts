import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'

// The switchboard — the landing page's live proof that one table reaches
// every client. A bank of eight toggles shared by everyone on the page; a
// flip is one mutation and every subscriber's row moves on the same commit.
//
// Shared-deployment guardrails: the bank is public and unauthenticated, so
// flips ride a global per-minute budget (the real defence — handles are
// minted client-side) and a per-handle window (fairness). No free text lands
// in the table: the handle is clamped to a short alphanumeric token.
export const POSITIONS = 8
const WINDOW_MS = 60_000
const GLOBAL_PER_WINDOW = 120
const HANDLE_PER_WINDOW = 30
const HANDLE = /^[a-z0-9-]{1,16}$/

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Bounded: `flip` only ever writes POSITIONS rows. Positions never
    // written yet read as off, so the board is complete before the first flip.
    const rows = await ctx.db.query('switches').take(POSITIONS * 2)
    const byPosition = new Map(rows.map(row => [row.position, row]))
    return Array.from({ length: POSITIONS }, (_, position) => {
      const row = byPosition.get(position)
      return row
        ? { position, on: row.on, by: row.by, at: row.at }
        : { position, on: false, by: '', at: 0 }
    })
  },
})

export const flip = mutation({
  args: { position: v.number(), by: v.string() },
  handler: async (ctx, { position, by }) => {
    if (!Number.isInteger(position) || position < 0 || position >= POSITIONS) {
      throw new ConvexError('No such switch.')
    }
    if (!HANDLE.test(by)) {
      throw new ConvexError('Handle must be 1–16 lowercase letters, digits or dashes.')
    }
    const now = Date.now()

    // The global budget: one `meta` row holding the window's start and the
    // flips counted inside it. Convex serialises mutations, so this is
    // race-free without any locking.
    const gate = await ctx.db.query('meta').withIndex('by_key', q => q.eq('key', 'switches.flips')).unique()
    const inWindow = gate !== null && now - gate.at < WINDOW_MS
    const used = inWindow ? (gate.count ?? 0) : 0
    if (used >= GLOBAL_PER_WINDOW) {
      throw new ConvexError('The board is cooling down — a lot of flips this minute. Try again in a moment.')
    }

    // The per-hand window off the rows themselves: `at` is the last flip per
    // position, so the whole bank is one bounded read.
    const rows = await ctx.db.query('switches').take(POSITIONS * 2)
    const mine = rows.filter(row => row.by === by && now - row.at < WINDOW_MS).length
    if (mine >= HANDLE_PER_WINDOW) {
      throw new ConvexError('This hand is flipping fast — a few flips a minute keeps the board readable.')
    }

    const existing = rows.find(row => row.position === position)
    if (existing) {
      await ctx.db.patch(existing._id, { on: !existing.on, by, at: now })
    }
    else {
      await ctx.db.insert('switches', { position, on: true, by, at: now })
    }

    if (gate === null) {
      await ctx.db.insert('meta', { key: 'switches.flips', at: now, count: 1 })
    }
    else if (inWindow) {
      await ctx.db.patch(gate._id, { count: used + 1 })
    }
    else {
      await ctx.db.patch(gate._id, { at: now, count: 1 })
    }
  },
})
