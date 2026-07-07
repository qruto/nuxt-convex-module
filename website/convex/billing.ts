import { action } from './_generated/server'
import { v } from 'convex/values'

// Demo stand-ins for the actions `@convex-dev/polar`'s `Polar.api()` exposes.
// They implement the exact argument/return contract `<CheckoutLink>` and
// `<CustomerPortalLink>` call (`generateCheckoutLink` / `generateCustomerPortalUrl`
// returning `{ url }`), pointed at polar.sh sandbox pages instead of a real
// organization — the playground demonstrates the component wiring without
// needing a Polar account.

export const generateCheckoutLink = action({
  args: {
    productIds: v.array(v.string()),
    origin: v.string(),
    successUrl: v.string(),
    subscriptionId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    trialInterval: v.optional(v.union(v.string(), v.null())),
    trialIntervalCount: v.optional(v.union(v.number(), v.null())),
    locale: v.optional(v.string()),
  },
  handler: async (_ctx, { productIds, successUrl }) => {
    const url = new URL('https://sandbox.polar.sh/qruto')
    url.searchParams.set('products', productIds.join(','))
    url.searchParams.set('success_url', successUrl)
    return { url: url.toString() }
  },
})

export const generateCustomerPortalUrl = action({
  args: { returnUrl: v.optional(v.string()) },
  handler: async (_ctx, { returnUrl }) => {
    const url = new URL('https://sandbox.polar.sh/qruto/portal')
    if (returnUrl) {
      url.searchParams.set('return_url', returnUrl)
    }
    return { url: url.toString() }
  },
})
