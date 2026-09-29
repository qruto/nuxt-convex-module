import { internalMutation, mutation, query } from './_generated/server'
import { paginationOptsValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import { admit, spend } from './gate'
import { rejectText } from './moderation'

// Task list — powers the `usePaginatedQuery`, `useQueries`, and optimistic
// update playground demos.

// Shared-deployment guardrails: `add` is public and unauthenticated, and
// every visitor reads the same list, so task text is length-capped and
// filtered (./moderation), writes ride a per-visitor bucket and a global
// per-minute budget (gate.ts), and `add` evicts the oldest tasks beyond the
// cap — `stats`' read stays below Convex's per-query limits, and a full list
// never locks the demo.
const MAX_TASKS = 200
const MAX_TEXT_LENGTH = 200
const WINDOW_MS = 60_000
const GLOBAL_PER_WINDOW = 30

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
      throw new ConvexError('Task text must not be empty.')
    }
    if (trimmed.length > MAX_TEXT_LENGTH) {
      throw new ConvexError(`Task text must be at most ${MAX_TEXT_LENGTH} characters.`)
    }
    const rejection = rejectText(trimmed)
    if (rejection) {
      throw new ConvexError(rejection)
    }
    await admit(ctx, 'posts')
    await spend(ctx, 'tasks.writes', GLOBAL_PER_WINDOW, WINDOW_MS,
      'The list is cooling down — a lot of new tasks this minute. Try again in a moment.')
    const newest = await ctx.db.query('tasks').order('desc').take(MAX_TASKS + 25)
    await ctx.db.insert('tasks', { text: trimmed, completed: false })
    // The new task takes one slot, so everything from index MAX-1 of the
    // pre-insert list is beyond the cap.
    for (const task of newest.slice(MAX_TASKS - 1)) {
      await ctx.db.delete(task._id)
    }
  },
})

export const toggle = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, { id }) => {
    const task = await ctx.db.get(id)
    if (task === null) {
      throw new ConvexError('Task not found.')
    }
    await admit(ctx, 'clicks')
    await ctx.db.patch(id, { completed: !task.completed })
  },
})

// Internal: no demo removes tasks (eviction in `add` keeps the list bounded),
// and a public "delete any task" is a griefing tool. Run it from the
// dashboard or `npx convex run` to clean up by hand.
export const remove = internalMutation({
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
    await admit(ctx, 'posts')
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
