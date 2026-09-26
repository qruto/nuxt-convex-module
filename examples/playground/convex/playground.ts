import { internal } from './_generated/api'
import { internalMutation, mutation, type MutationCtx } from './_generated/server'

/** Posts deleted in one transaction. */
const BATCH = 500

async function clear(ctx: MutationCtx) {
  for (const file of await ctx.db.query('files').take(BATCH)) {
    await ctx.storage.delete(file.storageId)
    await ctx.db.delete('files', file._id)
  }
  for (const counter of await ctx.db.query('counters').take(BATCH)) {
    await ctx.db.delete('counters', counter._id)
  }
  const posts = await ctx.db.query('posts').take(BATCH)
  for (const post of posts) {
    await ctx.db.delete('posts', post._id)
  }
  // A mutation has transaction limits, so a long feed is cleared in batches.
  if (posts.length === BATCH) {
    await ctx.scheduler.runAfter(0, internal.playground.clearRest, {})
  }
}

/** Deletes every counter, post and file. */
export const reset = mutation({ args: {}, handler: clear })

export const clearRest = internalMutation({ args: {}, handler: clear })
