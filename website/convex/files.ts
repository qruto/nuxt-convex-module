import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'

// File storage — powers the `useUpload` / `useUploadQueue` / `useStorageUrl`
// playground demos.

// Shared-deployment guardrails: the playground is public and unauthenticated,
// so `save` verifies the actual blob metadata (the UI's `accept="image/*"` is
// client-side only) and the table is capped by evicting the oldest files.
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 20
const MAX_NAME_LENGTH = 120

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const save = mutation({
  args: {
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { storageId, name }) => {
    // Trust the stored blob's metadata, never the caller-asserted type/size.
    const metadata = await ctx.db.system.get(storageId)
    if (metadata === null) {
      throw new Error('Uploaded file not found.')
    }
    if (!metadata.contentType?.startsWith('image/') || metadata.size > MAX_FILE_BYTES) {
      await ctx.storage.delete(storageId)
      throw new Error('Only images up to 5 MB can be stored in the playground.')
    }
    await ctx.db.insert('files', {
      storageId,
      name: name.trim().slice(0, MAX_NAME_LENGTH) || 'blob',
      type: metadata.contentType,
      size: metadata.size,
    })
    // Keep the gallery bounded: evict the oldest files (and their blobs)
    // beyond the cap. The cap holds per insert, so the overflow is tiny.
    const newest = await ctx.db.query('files').order('desc').take(MAX_FILES + 25)
    for (const file of newest.slice(MAX_FILES)) {
      await ctx.storage.delete(file.storageId)
      await ctx.db.delete(file._id)
    }
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query('files').order('desc').take(20)
    return await Promise.all(files.map(async file => ({
      ...file,
      url: await ctx.storage.getUrl(file.storageId),
    })))
  },
})

export const url = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId)
  },
})

export const remove = mutation({
  args: { id: v.id('files') },
  handler: async (ctx, { id }) => {
    const file = await ctx.db.get(id)
    if (file === null) {
      return
    }
    await ctx.storage.delete(file.storageId)
    await ctx.db.delete(id)
  },
})

// `generateUploadUrl` lets anyone push blobs that are never registered via
// `save` (abandoned or rejected uploads) — those are invisible to the app and
// would otherwise accumulate forever. Swept hourly from crons.ts.
export const purgeOrphans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const registered = new Set(
      (await ctx.db.query('files').take(MAX_FILES + 25)).map(file => file.storageId),
    )
    const blobs = await ctx.db.system.query('_storage').take(4000)
    for (const blob of blobs) {
      // Skip fresh blobs: an in-flight upload has a blob before `save` runs.
      if (blob._creationTime < oneHourAgo && !registered.has(blob._id)) {
        await ctx.storage.delete(blob._id)
      }
    }
  },
})
