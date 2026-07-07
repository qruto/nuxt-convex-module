import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// File storage — powers the `useUpload` / `useUploadQueue` / `useStorageUrl`
// playground demos.

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
  handler: async (ctx, args) => {
    await ctx.db.insert('files', args)
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
