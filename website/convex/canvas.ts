import type { MutationCtx } from './_generated/server'
import { internalMutation, mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { cooldown, spend } from './gate'

// THE CANVAS — the hero panel's instrument (2026-09-12, replacing the chat).
// A 21 × 11 grid every visitor paints on (odd both ways, so it has a
// centre cell). Every stroke is ONE ROW, appended
// and never patched: a cell with an ink, or a clear. The frame is never
// stored — `at` folds the rows up to a timestamp, which is what lets the
// panel scrub through the table's history with nothing but a query argument
// (`{ at: null }` reads now and stays subscribed).
//
// Shared-deployment guardrails: the table is public and unauthenticated. No
// free text lands in it (a cell index and one of three inks), writes ride a
// global per-minute budget, a clear rides a short cooldown, and every read
// is bounded because `paint` keeps the table under a cap — rows before the
// latest clear no longer touch the frame, so they are the first to go.
export const COLUMNS = 21
export const ROWS = 11
export const CELLS = COLUMNS * ROWS
export type Ink = 'signal' | 'graphite' | 'none'

// Roomy enough to paint the whole frame twice over since the last clear.
const MAX_STROKES = 600
const WINDOW_MS = 60_000
const GLOBAL_PER_WINDOW = 400
const CLEAR_COOLDOWN_MS = 8_000

export const ink = v.union(v.literal('signal'), v.literal('graphite'), v.literal('none'))

function blank(): Ink[] {
  return Array.from({ length: CELLS }, () => 'none')
}

/** The frame as the table stood at `at` — every stroke up to that instant, folded. */
export const at = query({
  args: { at: v.union(v.number(), v.null()) },
  handler: async (ctx, { at }): Promise<Ink[]> => {
    // Ascending `_creationTime` is the default order; bounded by the cap.
    const rows = await ctx.db.query('strokes').take(MAX_STROKES + 50)
    const frame = blank()
    for (const row of rows) {
      if (at !== null && row._creationTime > at) break
      if (row.kind === 'clear') frame.fill('none')
      else frame[row.cell] = row.ink
    }
    return frame
  },
})

/** The strip under the canvas: one tick per commit, in order. */
export const log = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('strokes').take(MAX_STROKES + 50)
    return rows.map(row => ({ at: row._creationTime, clear: row.kind === 'clear' }))
  },
})

// The global budget — the same gate the switchboard and the console ride.
function spendStroke(ctx: MutationCtx) {
  return spend(ctx, 'canvas.writes', GLOBAL_PER_WINDOW, WINDOW_MS,
    'The canvas is cooling down — a lot of strokes this minute. Try again in a moment.')
}

// Keep the table under the cap. Rows before the latest clear cannot reach
// the current frame, so they are dropped first; only a canvas that is full
// of strokes since its last clear refuses (or, for a clear, is reset outright).
async function makeRoom(ctx: MutationCtx, clearing: boolean) {
  const rows = await ctx.db.query('strokes').take(MAX_STROKES + 50)
  if (rows.length < MAX_STROKES) return
  let lastClear = -1
  rows.forEach((row, index) => {
    if (row.kind === 'clear') lastClear = index
  })
  const drop = clearing && rows.length - Math.max(lastClear, 0) >= MAX_STROKES
    ? rows
    : rows.slice(0, Math.max(lastClear, 0))
  for (const row of drop) await ctx.db.delete(row._id)
  if (rows.length - drop.length >= MAX_STROKES) {
    throw new ConvexError('The canvas is full — sweep it to keep painting.')
  }
}

export const paint = mutation({
  args: { cell: v.number(), ink },
  handler: async (ctx, { cell, ink }) => {
    if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) {
      throw new ConvexError('No such cell.')
    }
    await spendStroke(ctx)
    await makeRoom(ctx, false)
    await ctx.db.insert('strokes', { kind: 'paint', cell, ink })
  },
})

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    // One sweep every few seconds, tracked in `meta` like the chat's reset.
    await cooldown(ctx, 'canvas.clear', CLEAR_COOLDOWN_MS, 'The canvas was swept a moment ago — give it a few seconds.')
    await spendStroke(ctx)
    await makeRoom(ctx, true)
    await ctx.db.insert('strokes', { kind: 'clear' })
  },
})

// THE OPENING FRAME — what the canvas shows before anyone has touched it.
// A 21 × 11 picture, one character per cell: `#` signal, `+` graphite,
// `.` empty. "hi" in signal on the left; on the right a waving hand drawn
// in outline, graphite so it reads white on the dark plate, thumb on the
// left (the mirror of 👋).
const OPENING = [
  '.....................',
  '.....................',
  '...#.........+.+.....',
  '...#.......+.+.+.+...',
  '...###.#...+.+.+.+...',
  '...#.#.#..+......+...',
  '...#.#.#..+......+...',
  '...#.#.#...+....+....',
  '...#.#.#....++++.....',
  '.....................',
  '.....................',
]

/** Reset the table to the opening frame: `npx convex run canvas:seed`. */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('strokes').take(MAX_STROKES + 50)
    for (const row of rows) await ctx.db.delete(row._id)
    for (const [y, line] of OPENING.entries()) {
      for (const [x, char] of [...line].entries()) {
        if (char === '.') continue
        const cell = y * COLUMNS + x
        await ctx.db.insert('strokes', { kind: 'paint', cell, ink: char === '#' ? 'signal' : 'graphite' })
      }
    }
  },
})
