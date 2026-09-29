import type { ActionCtx, MutationCtx } from './_generated/server'
import { HOUR, MINUTE, RateLimiter } from '@convex-dev/rate-limiter'
import { ConvexError } from 'convex/values'
import { components } from './_generated/api'

// The three gates every public demo rides. The first two are global, each
// one row in `meta` keyed by the operation it guards. Convex serialises
// mutations, so both are race-free without any locking — and a throw later
// in the same mutation rolls the row back, so a gate can be spent before the
// work it admits.
//
// The third is per visitor. The demos have no sign-up, so a visitor is the
// address the request came from: Convex hands it to every mutation and
// action (`ctx.meta.getRequestMetadata()`). Each bucket's burst plus a
// minute of refill stays under the global budget it sits in front of, so
// one address can never spend that budget alone; the global budgets still
// cap what many addresses do together.

/**
 * Spend one write from a global per-window budget: the row holds the
 * window's start and the writes counted inside it. Throws `message` once
 * the window is full; returns the timestamp the write was stamped with.
 */
export async function spend(ctx: MutationCtx, key: string, limit: number, windowMs: number, message: string) {
  const now = Date.now()
  const gate = await ctx.db.query('meta').withIndex('by_key', q => q.eq('key', key)).unique()
  const inWindow = gate !== null && now - gate.at < windowMs
  const used = inWindow ? (gate.count ?? 0) : 0
  if (used >= limit) throw new ConvexError(message)
  if (gate === null) await ctx.db.insert('meta', { key, at: now, count: 1 })
  else if (inWindow) await ctx.db.patch(gate._id, { count: used + 1 })
  else await ctx.db.patch(gate._id, { at: now, count: 1 })
  return now
}

/**
 * Trip a cooldown: the row holds when the operation last ran. Throws
 * `message` while the cooldown is still running, else restamps the row and
 * returns the new timestamp. A public wipe is as good a griefing tool as
 * spam, which is what these guard.
 */
export async function cooldown(ctx: MutationCtx, key: string, ms: number, message: string) {
  const now = Date.now()
  const gate = await ctx.db.query('meta').withIndex('by_key', q => q.eq('key', key)).unique()
  if (gate && now - gate.at < ms) throw new ConvexError(message)
  if (gate) await ctx.db.patch(gate._id, { at: now })
  else await ctx.db.insert('meta', { key, at: now })
  return now
}

// Token buckets per address: a burst for one honest go at a demo (a key
// mash, a fader drag, a batch upload), then a steady trickle.
const buckets = {
  reactions: { kind: 'token bucket', rate: 30, period: MINUTE, capacity: 10 },
  clicks: { kind: 'token bucket', rate: 60, period: MINUTE, capacity: 40 },
  canvas: { kind: 'token bucket', rate: 120, period: MINUTE, capacity: 60 },
  posts: { kind: 'token bucket', rate: 6, period: MINUTE, capacity: 4 },
  wipes: { kind: 'token bucket', rate: 6, period: HOUR, capacity: 3 },
  presence: { kind: 'token bucket', rate: 40, period: MINUTE, capacity: 20 },
  uploads: { kind: 'token bucket', rate: 20, period: HOUR, capacity: 10 },
  analyze: { kind: 'token bucket', rate: 12, period: MINUTE, capacity: 4 },
} as const
type Bucket = keyof typeof buckets

const limiter = new RateLimiter(components.rateLimiter, buckets)

/**
 * The bucket key for an address: IPv4 whole (plain or IPv4-mapped), IPv6 by
 * its /64 — one host or household is handed a whole /64, so a full IPv6
 * address would let one script rotate through fresh buckets.
 */
function addressKey(ip: string): string {
  const v4 = /^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)?.[1]
  if (v4) return v4
  const [address = ''] = ip.split('%')
  const [head = '', tail] = address.split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const zeros = Array.from({ length: Math.max(0, 8 - left.length - right.length) }, () => '0')
  const groups = tail === undefined ? left : [...left, ...zeros, ...right]
  return `${groups.slice(0, 4).map(group => (Number.parseInt(group, 16) || 0).toString(16)).join(':')}::/64`
}

/**
 * Spend one token from this visitor's `bucket`; false once it is empty.
 * Scheduled and internal runs carry no address and always pass. Silent —
 * for writes the visitor never asked for, like a presence heartbeat.
 */
export async function canAdmit(ctx: MutationCtx | ActionCtx, bucket: Bucket) {
  const { ip } = await ctx.meta.getRequestMetadata()
  if (ip === null) return true
  const { ok } = await limiter.limit(ctx, bucket, { key: addressKey(ip) })
  return ok
}

/**
 * `DEMOS_PAUSED=1` on the deployment stops every demo write at once while
 * reads keep working (website/README.md says when). Any other value, or
 * none, leaves the demos open.
 */
export const paused = () => process.env.DEMOS_PAUSED === '1'

/**
 * The gate in front of every public demo write: the pause switch, then the
 * visitor's `bucket` when one is named. Throws a `ConvexError` with a plain
 * string — the only payload the demo panels print.
 */
export async function admit(ctx: MutationCtx | ActionCtx, bucket?: Bucket) {
  if (paused()) {
    throw new ConvexError('The live demos are paused for a moment — reading still works.')
  }
  if (bucket && !(await canAdmit(ctx, bucket))) {
    throw new ConvexError('You’re going fast — this demo is shared, so try again in a moment.')
  }
}
