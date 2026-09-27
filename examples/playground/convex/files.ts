import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalMutation, mutation, query } from './_generated/server'
import { bump } from './counters'

/** Files kept; older ones are deleted with their blobs. */
const KEEP = 6
/** Largest image kept. An upload URL itself accepts a file of any size. */
const MAX_SIZE = 5 * 1024 * 1024
/** An upload URL expires after an hour; the cleanup waits a few minutes more. */
const UPLOAD_URL_LIFETIME = 65 * 60 * 1000
/** Blobs checked in one transaction. */
const BATCH = 100

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Anyone who can reach the deployment can upload with this URL and never
    // call `save`, which skips its checks. Once the URL has expired, delete
    // what was uploaded but not kept.
    await ctx.scheduler.runAfter(UPLOAD_URL_LIFETIME, internal.files.clearUnsaved, {})
    return await ctx.storage.generateUploadUrl()
  },
})

/** Deletes uploads that were never saved as a file. */
export const clearUnsaved = internalMutation({
  args: {},
  handler: async (ctx) => {
    // A newer blob may still be on its way to `save`.
    const cutoff = Date.now() - 60 * 1000
    let deleted = 0
    for (const blob of await ctx.db.system.query('_storage').take(BATCH)) {
      if (blob._creationTime > cutoff) break
      const kept = await ctx.db.query('files').withIndex('by_storageId', q => q.eq('storageId', blob._id)).first()
      if (kept) continue
      await ctx.storage.delete(blob._id)
      deleted++
    }
    if (deleted > 0) await ctx.scheduler.runAfter(0, internal.files.clearUnsaved, {})
  },
})

/** Keeps an uploaded image. Returns why a file was rejected, or `null` once saved. */
export const save = mutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    // Check the stored blob itself: the client's `accept="image/*"` is only a hint.
    const metadata = await ctx.db.system.get('_storage', storageId)
    if (!metadata?.contentType?.startsWith('image/') || metadata.size > MAX_SIZE) {
      // Return rather than throw: a throw would roll the deletion back.
      if (metadata) await ctx.storage.delete(storageId)
      return 'Only images up to 5 MB are kept in the playground.'
    }
    await ctx.db.insert('files', { storageId })
    await bump(ctx, 'files', 1)

    const newest = await ctx.db.query('files').order('desc').take(KEEP + 10)
    for (const file of newest.slice(KEEP)) {
      await ctx.storage.delete(file.storageId)
      await ctx.db.delete('files', file._id)
    }
    return null
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
