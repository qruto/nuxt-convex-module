import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Convex functions for the docs playground and the homepage's live demos — a
// small team-chat + tasks demo that exercises every client feature: live
// queries, mutations (with optimistic updates), actions, cursor pagination,
// and file storage — plus the shared instruments the landing page runs
// against the same deployment (the hero's canvas, switches, the console,
// presence).
export default defineSchema({
  messages: defineTable({
    author: v.string(),
    body: v.string(),
  }),
  tasks: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
  files: defineTable({
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  }),
  // One row per guarded operation (e.g. `messages.clear`) — the timestamp
  // gate that keeps destructive public mutations from being spammed.
  meta: defineTable({
    key: v.string(),
    at: v.number(),
    // Optional tally for the gates that count within a window (the
    // switchboard's global flip budget).
    count: v.optional(v.number()),
  }).index('by_key', ['key']),

  // THE SWITCHBOARD (landing page). A fixed bank of toggles every visitor
  // shares: one row per switch position, flipped in place. `by` is the
  // per-visitor handle of whoever flipped it last, `at` when.
  switches: defineTable({
    position: v.number(),
    on: v.boolean(),
    by: v.string(),
    at: v.number(),
  }).index('by_position', ['position']),

  // WHO IS HERE. One row per browser session on the landing page, refreshed
  // by a heartbeat while the page is visible and swept by a cron once stale.
  presence: defineTable({
    sid: v.string(),
    at: v.number(),
  })
    .index('by_sid', ['sid'])
    .index('by_at', ['at']),

  // THE CONSOLE'S OTHER INSTRUMENTS. One row per named readout — the
  // level fader (0..100) and the pulse counter — patched in place.
  console: defineTable({
    key: v.string(),
    value: v.number(),
    at: v.number(),
  }).index('by_key', ['key']),

  // THE CANVAS (hero panel). An append-only log of strokes on a 21 × 11
  // grid: a cell taking an ink, or a clear. Never patched — the frame is
  // folded from the rows up to a timestamp (canvas.ts), which is what the
  // hero's scrubber reads through. `_creationTime` is the commit order.
  strokes: defineTable(v.union(
    v.object({
      kind: v.literal('paint'),
      cell: v.number(),
      ink: v.union(v.literal('signal'), v.literal('graphite'), v.literal('none')),
    }),
    v.object({ kind: v.literal('clear') }),
  )),

  // THE REACTIONS (hero panel, 2026-09-15 — the canvas moved to /canvas).
  // An append-only log of key presses: which key (an index into
  // shared/reactions.ts's KINDS), the name the sender sends as, and the
  // sender's city when they switched it on. Kept under a cap, oldest first
  // out; `_creationTime` is the order the ledger prints.
  reactions: defineTable({
    kind: v.number(),
    name: v.string(),
    city: v.optional(v.string()),
  }),
  // Today's count per key — Convex has no count operator, so `send` keeps
  // this tally beside the row it inserts. One row per UTC day and key.
  reactionTally: defineTable({
    day: v.string(),
    kind: v.number(),
    count: v.number(),
  }).index('by_day_and_kind', ['day', 'kind']),
})
