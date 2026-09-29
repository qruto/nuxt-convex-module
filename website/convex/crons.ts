import { cronJobs } from 'convex/server'
import { components, internal } from './_generated/api'
import { internalMutation } from './_generated/server'

const crons = cronJobs()

// Playground uploads live for an hour, saved or not — sweep them regularly.
crons.interval('expire uploads', { minutes: 15 }, internal.files.expire, {})

// Landing-page presence rows outlive the sessions that wrote them; drop
// anything that stopped heartbeating.
crons.interval('sweep stale presence', { minutes: 5 }, internal.presence.sweep, {})

// The per-visitor buckets (gate.ts) keep one row per address; start them all
// over once a day so the table stays small. A cron can't name a component's
// function directly, hence the wrapper.
export const resetVisitorLimits = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(components.rateLimiter.lib.clearAll, {})
  },
})
crons.interval('reset visitor limits', { hours: 24 }, internal.crons.resetVisitorLimits, {})

export default crons
