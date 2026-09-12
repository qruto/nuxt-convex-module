import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Convex functions for the docs playground and the homepage's live demos — a
// small team-chat + tasks demo that exercises every client feature: live
// queries, mutations (with optimistic updates), actions, cursor pagination,
// and file storage — plus the three tiny shared instruments the landing page
// runs against the same deployment (switches, presence, a poll).
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
})
