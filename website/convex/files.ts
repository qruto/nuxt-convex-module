import type { Doc } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { internal } from './_generated/api'
import { internalMutation, mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { admit, paused, spend } from './gate'
import { rejectText } from './moderation'

// File storage — powers the `useUpload` / `useUploadQueue` / `useStorageUrl`
// playground demos.

// Shared-deployment guardrails: the playground is public and unauthenticated,
// and an image is the one thing the word filter can't read. So each browser
// lists only its own uploads (`owner`: a random id only that browser knows —
// privacy, not authentication; a served URL is a bearer link, as Convex's
// always are), `save` verifies the actual blob metadata (the UI's
// `accept="image/*"` is client-side only), `url` serves saved files only, and
// every upload expires an hour after it lands. An upload URL takes any type
// and any size, and a refused blob can't be deleted inside the mutation that
// refuses it (the throw rolls the delete back) — so the sweep below removes
// every blob `save` would refuse, saved or not, within minutes.
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 20
const MAX_NAME_LENGTH = 120
const HOUR_MS = 60 * 60 * 1000
const UPLOADS_PER_HOUR = 200
const EXPIRE_BATCH = 200
const OWNER = /^[0-9a-f-]{36}$/
// Raster formats every browser renders. SVG stays out: it can carry script.
const IMAGE_TYPE = /^image\/(?:png|jpeg|gif|webp|avif)$/i

/** Whether `save` would keep this blob. */
function storable(blob: { contentType?: string, size: number }) {
  return IMAGE_TYPE.test(blob.contentType ?? '') && blob.size <= MAX_FILE_BYTES
}

/** Drop a file row and, if it is still there, its blob. */
async function discard(ctx: MutationCtx, file: Doc<'files'>) {
  if (await ctx.db.system.get(file.storageId)) {
    await ctx.storage.delete(file.storageId)
  }
  await ctx.db.delete(file._id)
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await admit(ctx, 'uploads')
    await spend(ctx, 'files.uploads', UPLOADS_PER_HOUR, HOUR_MS,
      'Uploads are cooling down — a lot of them this hour. Try again later.')
    return await ctx.storage.generateUploadUrl()
  },
})

export const save = mutation({
  args: {
    owner: v.string(),
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { owner, storageId, name }) => {
    // The pause only: a save is bounded by the upload URL it needs.
    await admit(ctx)
    if (!OWNER.test(owner)) {
      throw new ConvexError('Uploads need the id this browser keeps for them.')
    }
    // One row per blob, so saves are bounded by the upload URLs above.
    const saved = await ctx.db.query('files').withIndex('by_storage_id', q => q.eq('storageId', storageId)).first()
    if (saved) {
      return
    }
    // Trust the stored blob's metadata, never the caller-asserted type/size.
    const metadata = await ctx.db.system.get(storageId)
    if (metadata === null) {
      throw new ConvexError('Uploaded file not found.')
    }
    if (!storable(metadata)) {
      throw new ConvexError('Only PNG, JPEG, GIF, WebP or AVIF images up to 5 MB can be stored in the playground.')
    }
    const trimmed = name.trim().slice(0, MAX_NAME_LENGTH)
    await ctx.db.insert('files', {
      owner,
      storageId,
      name: trimmed === '' || rejectText(trimmed) ? 'image' : trimmed,
      type: metadata.contentType ?? '',
      size: metadata.size,
    })
    // A browser keeps its newest uploads, so the gallery always lists them all.
    const mine = await ctx.db.query('files').withIndex('by_owner', q => q.eq('owner', owner)).order('desc').take(MAX_FILES + 5)
    for (const file of mine.slice(MAX_FILES)) {
      await discard(ctx, file)
    }
  },
})

export const list = query({
  args: { owner: v.string() },
  handler: async (ctx, { owner }) => {
    const files = await ctx.db.query('files').withIndex('by_owner', q => q.eq('owner', owner)).order('desc').take(MAX_FILES)
    return await Promise.all(files.map(async file => ({
      ...file,
      url: await ctx.storage.getUrl(file.storageId),
    })))
  },
})

export const url = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    // Saved files only — an upload URL alone must not buy free hosting.
    const saved = await ctx.db.query('files').withIndex('by_storage_id', q => q.eq('storageId', storageId)).first()
    return saved ? await ctx.storage.getUrl(storageId) : null
  },
})

export const remove = mutation({
  args: { id: v.id('files'), owner: v.string() },
  handler: async (ctx, { id, owner }) => {
    const file = await ctx.db.get(id)
    if (file === null || file.owner !== owner || paused()) {
      return
    }
    await discard(ctx, file)
  },
})

// Every upload lives an hour, saved or not. Independent passes, so a blob is
// never deleted by way of its row, nor twice: rows past the hour; blobs past
// it, five minutes later (a blob lands before its row); and, whatever their
// age, the last ten minutes' blobs `save` would refuse. Swept every five
// minutes from crons.ts. A full batch of the first two reschedules the rest;
// the last pass never needs to — the hourly upload budget fits in one batch.
export const expire = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const rows = await ctx.db.query('files')
      .withIndex('by_creation_time', q => q.lt('_creationTime', now - HOUR_MS))
      .take(EXPIRE_BATCH)
    await Promise.all(rows.map(row => ctx.db.delete(row._id)))
    const stale = await ctx.db.system.query('_storage')
      .withIndex('by_creation_time', q => q.lt('_creationTime', now - HOUR_MS - 5 * 60 * 1000))
      .take(EXPIRE_BATCH)
    const recent = await ctx.db.system.query('_storage')
      .withIndex('by_creation_time', q => q.gt('_creationTime', now - 10 * 60 * 1000))
      .take(EXPIRE_BATCH)
    const refused = recent.filter(blob => !storable(blob))
    await Promise.all([...stale, ...refused].map(blob => ctx.storage.delete(blob._id)))
    if (rows.length === EXPIRE_BATCH || stale.length === EXPIRE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.files.expire, {})
    }
  },
})
