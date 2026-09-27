import rateLimiter from '@convex-dev/rate-limiter/convex.config'
import { defineApp } from 'convex/server'

// The per-visitor buckets in gate.ts live in this component's own tables.
const app = defineApp()
app.use(rateLimiter)

export default app
