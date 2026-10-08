# Billing: Polar

```bash
npm i @convex-dev/polar@~0.9.0 @polar-sh/checkout
```

Once `@convex-dev/polar` is in `package.json`, the module registers `<CheckoutLink>` and `<CustomerPortalLink>` globally. Nothing goes in `nuxt.config.ts`.

## Convex side

`@convex-dev/polar` 0.9:

1. `convex/convex.config.ts`:

   ```ts
   import polar from '@convex-dev/polar/convex.config.js'
   import { defineApp } from 'convex/server'

   const app = defineApp()
   app.use(polar)
   export default app
   ```

2. Env vars on the deployment:

   ```bash
   npx convex env set POLAR_ORGANIZATION_TOKEN <token>
   npx convex env set POLAR_WEBHOOK_SECRET <secret>
   ```

   `POLAR_SERVER` is `sandbox` or `production`. The tokens come from the user's Polar dashboard; ask for them, never invent them. In Polar, the webhook endpoint is the deployment's site URL plus `/polar/events`, with the `product.created`, `product.updated`, `subscription.created` and `subscription.updated` events.

3. **`convex/billing.ts`.** The file name matters: the components read their actions from `api.billing`.

   ```ts
   import { Polar } from '@convex-dev/polar'
   import { api, components } from './_generated/api'
   import type { DataModel } from './_generated/dataModel'

   export const polar = new Polar<DataModel>(components.polar, {
     getUserInfo: async (ctx) => {
       const user = await ctx.runQuery(api.users.current) // your own query
       return { userId: user._id, email: user.email }
     },
   })

   export const { generateCheckoutLink, generateCustomerPortalUrl } = polar.api()
   ```

   With the actions in another module, pass it to the components as `:polar-api="api.yourModule"`.

4. `convex/http.ts`: `polar.registerRoutes(http)` on an `httpRouter()`, which handles the webhook at `/polar/events`.

## Use

```vue
<template>
  <CheckoutLink :product-ids="[productId]">
    Upgrade
  </CheckoutLink>
  <CustomerPortalLink return-url="/account">
    Manage subscription
  </CustomerPortalLink>
</template>
```

The props and the rest of the setup (products, subscriptions, `syncProducts`) are covered in https://nuxt-convex-module.dev/raw/components/polar.md and in `@convex-dev/polar`'s README.
