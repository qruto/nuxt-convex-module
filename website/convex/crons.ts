import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Storage blobs uploaded but never registered via `files.save` leak forever
// on a shared deployment — sweep them regularly.
crons.interval('purge orphaned uploads', { hours: 1 }, internal.files.purgeOrphans, {})

// Landing-page presence rows outlive the sessions that wrote them; drop
// anything that stopped heartbeating.
crons.interval('sweep stale presence', { minutes: 5 }, internal.presence.sweep, {})

export default crons
