import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Backend for the docs playground — a small team-chat + tasks demo that
// exercises every client feature: live queries, mutations (with optimistic
// updates), actions, cursor pagination, and file storage.
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
})
