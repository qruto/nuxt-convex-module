import { mutation, query } from './_generated/server'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

// Task list — powers the `usePaginatedQuery`, `useQueries`, and optimistic
// update playground demos.

// Shared-deployment guardrails: `add` is public and unauthenticated, so task
// text is length-capped and the table has a hard cap, keeping `stats`' read
// below Convex's per-query limits.
const MAX_TASKS = 200
const MAX_TEXT_LENGTH = 200

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db.query('tasks').order('desc').paginate(paginationOpts)
  },
})

export const stats = query({
  args: {},
  handler: async (ctx) => {
    // Bounded read — `add` caps the table, so this sees every task.
    const tasks = await ctx.db.query('tasks').take(MAX_TASKS * 2)
    return {
      total: tasks.length,
      completed: tasks.filter(task => task.completed).length,
    }
  },
})

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const trimmed = text.trim()
    if (trimmed === '') {
      throw new Error('Task text must not be empty.')
    }
    if (trimmed.length > MAX_TEXT_LENGTH) {
      throw new Error(`Task text must be at most ${MAX_TEXT_LENGTH} characters.`)
    }
    const existing = await ctx.db.query('tasks').take(MAX_TASKS)
    if (existing.length >= MAX_TASKS) {
      throw new Error('The playground task list is full — remove some tasks first.')
    }
    await ctx.db.insert('tasks', { text: trimmed, completed: false })
  },
})

export const toggle = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, { id }) => {
    const task = await ctx.db.get(id)
    if (task === null) {
      throw new Error('Task not found.')
    }
    await ctx.db.patch(id, { completed: !task.completed })
  },
})

export const remove = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('tasks').take(1)
    if (existing.length > 0) {
      return
    }
    const samples = [
      'Review the pagination docs',
      'Wire up the checkout flow',
      'Ship the file uploader',
      'Write the release notes',
      'Fix the SSR hydration warning',
      'Profile the WebSocket reconnects',
      'Update the auth middleware',
      'Add optimistic updates to the task list',
      'Benchmark the query cache',
      'Clean up stale feature flags',
      'Document the import aliases',
      'Test the upload queue on slow networks',
    ]
    await Promise.all(samples.map(text => ctx.db.insert('tasks', { text, completed: false })))
  },
})
