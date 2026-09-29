import type { Doc } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { internal } from './_generated/api'
import { httpAction, internalMutation, mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { admit, paused, spend } from './gate'
import { rejectText } from './moderation'

// File storage — powers the `useUpload` / `useUploadQueue` / `useStorageUrl`
// playground demos.

// Shared-deployment guardrails: the playground is public and unauthenticated,
// and an image is the one thing the word filter can't read. Convex's own
// upload URL takes any bytes of any size under any label, so
// `generateUploadUrl` hands out a single-use URL to `upload` below instead: it
// refuses more than 5 MB before storing anything, and stores only bytes whose
// signature is a PNG, JPEG, GIF, WebP or AVIF image, under the type the bytes
// show. Each browser lists only its own uploads (`owner`: a random id only
// that browser knows — privacy, not authentication; a served URL is a bearer
// link, as Convex's always are), `url` serves saved files only, and every
// upload expires an hour after it lands.
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_FILES = 20
const MAX_NAME_LENGTH = 120
const HOUR_MS = 60 * 60 * 1000
const TICKET_MS = 10 * 60 * 1000
const UPLOADS_PER_HOUR = 200
const EXPIRE_BATCH = 200
const OWNER = /^[0-9a-f-]{36}$/
const IMAGE_TYPE = /^image\/(?:png|jpeg|gif|webp|avif)$/i
const REFUSED = 'Only PNG, JPEG, GIF, WebP or AVIF images up to 5 MB can be stored in the playground.'
// The upload is a cross-origin XHR from the site, and nothing about it is
// private: the ticket in the URL is the only key.
const CORS = { 'Access-Control-Allow-Origin': '*' }

/**
 * The image type the bytes themselves show, or `null`. The upload's own label
 * is never trusted, and SVG never passes: it can carry script.
 */
function imageType(bytes: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to))
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png'
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg'
  if (ascii(0, 4) === 'GIF8') return 'image/gif'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif'
  return null
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
    const ticket = await ctx.db.insert('uploadTickets', {})
    return `${process.env.CONVEX_SITE_URL}/upload?ticket=${ticket}`
  },
})

/** Spend an upload URL's ticket: true once, while it is fresh. */
export const redeem = internalMutation({
  args: { ticket: v.string() },
  handler: async (ctx, { ticket }) => {
    const id = ctx.db.normalizeId('uploadTickets', ticket)
    const row = id === null ? null : await ctx.db.get(id)
    if (row === null) return false
    await ctx.db.delete(row._id)
    return Date.now() - row._creationTime < TICKET_MS
  },
})

/** Where the URLs from `generateUploadUrl` point (routed in http.ts). */
export const upload = httpAction(async (ctx, request) => {
  const refuse = (status: number, reason: string) => new Response(reason, { status, headers: CORS })
  if (Number(request.headers.get('Content-Length')) > MAX_FILE_BYTES) return refuse(413, REFUSED)
  const ticket = new URL(request.url).searchParams.get('ticket') ?? ''
  if (!(await ctx.runMutation(internal.files.redeem, { ticket }))) {
    return refuse(403, 'That upload link was used or has expired — pick the file again.')
  }
  const bytes = new Uint8Array(await request.arrayBuffer())
  const type = imageType(bytes)
  if (bytes.byteLength > MAX_FILE_BYTES || type === null) return refuse(415, REFUSED)
  const storageId = await ctx.storage.store(new Blob([bytes], { type }))
  return new Response(JSON.stringify({ storageId }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})

/** The browser's preflight for `upload`: an image `Content-Type` isn't a simple one. */
export const uploadPreflight = httpAction(async () => new Response(null, {
  status: 204,
  headers: {
    ...CORS,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  },
}))

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
    // `upload` already checked the bytes; the stored metadata is checked
    // again in case a blob ever arrives another way.
    const metadata = await ctx.db.system.get(storageId)
    if (metadata === null) {
      throw new ConvexError('Uploaded file not found.')
    }
    if (!IMAGE_TYPE.test(metadata.contentType ?? '') || metadata.size > MAX_FILE_BYTES) {
      throw new ConvexError(REFUSED)
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

// Every upload lives an hour, saved or not, and so does a ticket nobody used.
// Independent passes, so a blob is never deleted by way of its row, nor
// twice; blobs go five minutes after rows, since a blob lands before its row.
// Swept every 15 minutes from crons.ts; a full batch reschedules the rest.
export const expire = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - HOUR_MS
    const rows = await ctx.db.query('files')
      .withIndex('by_creation_time', q => q.lt('_creationTime', cutoff))
      .take(EXPIRE_BATCH)
    const tickets = await ctx.db.query('uploadTickets')
      .withIndex('by_creation_time', q => q.lt('_creationTime', cutoff))
      .take(EXPIRE_BATCH)
    await Promise.all([...rows, ...tickets].map(row => ctx.db.delete(row._id)))
    const blobs = await ctx.db.system.query('_storage')
      .withIndex('by_creation_time', q => q.lt('_creationTime', cutoff - 5 * 60 * 1000))
      .take(EXPIRE_BATCH)
    await Promise.all(blobs.map(blob => ctx.storage.delete(blob._id)))
    if ([rows, tickets, blobs].some(batch => batch.length === EXPIRE_BATCH)) {
      await ctx.scheduler.runAfter(0, internal.files.expire, {})
    }
  },
})
