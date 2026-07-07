import { mutation, query } from './_generated/server'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

// Task list — powers the `usePaginatedQuery`, `useQueries`, and optimistic
// update playground demos.

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db.query('tasks').order('desc').paginate(paginationOpts)
  },
})

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query('tasks').collect()
    return {
      total: tasks.length,
      completed: tasks.filter(task => task.completed).length,
    }
  },
})

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    if (text.trim() === '') {
      throw new Error('Task text must not be empty.')
    }
    await ctx.db.insert('tasks', { text: text.trim(), completed: false })
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
