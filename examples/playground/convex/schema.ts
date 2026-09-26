import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Running totals, so a query can read "how many" without counting rows.
  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index('by_name', ['name']),

  posts: defineTable({
    emoji: v.string(),
    text: v.string(),
  }),

  files: defineTable({
    storageId: v.id('_storage'),
  }),
})
