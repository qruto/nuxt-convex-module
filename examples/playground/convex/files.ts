import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { bump } from './counters'

/** Files kept; older ones are deleted with their blobs. */
const KEEP = 6

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const save = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    // Check the stored blob itself: the client's `accept="image/*"` is only a hint.
    const metadata = await ctx.db.system.get('_storage', storageId)
    if (!metadata?.contentType?.startsWith('image/')) {
      if (metadata) await ctx.storage.delete(storageId)
      throw new Error('Only images are kept in the playground.')
    }
    await ctx.db.insert('files', { storageId })
    await bump(ctx, 'files', 1)

    const newest = await ctx.db.query('files').order('desc').take(KEEP + 10)
    for (const file of newest.slice(KEEP)) {
      await ctx.storage.delete(file.storageId)
      await ctx.db.delete('files', file._id)
    }
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('files').order('desc').take(KEEP)
  },
})

export const getUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId)
  },
})
