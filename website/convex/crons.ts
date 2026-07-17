import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Storage blobs uploaded but never registered via `files.save` leak forever
// on a shared deployment — sweep them regularly.
crons.interval('purge orphaned uploads', { hours: 1 }, internal.files.purgeOrphans, {})

export default crons
