<script setup lang="ts">
import { makeFunctionReference } from 'convex/server'

// One piece of each integration, so its runtime ends up in the server bundle.
const { isLoading } = useBetterAuth()
// No Convex functions behind this app: a reference by name stands in for
// `api.billing`. Nothing calls it during SSR.
const polarApi = { generateCheckoutLink: makeFunctionReference<'action'>('billing:generateCheckoutLink') }
</script>

<template>
  <main>
    <p>Better Auth loading: {{ isLoading }}</p>
    <ConvexProviderWithClerk>
      <AuthLoading>Clerk loading</AuthLoading>
    </ConvexProviderWithClerk>
    <ConvexProviderWithAuth0>
      <AuthLoading>Auth0 loading</AuthLoading>
    </ConvexProviderWithAuth0>
    <CheckoutLink
      :polar-api="polarApi"
      :product-ids="['placeholder']"
    >
      Upgrade
    </CheckoutLink>
  </main>
</template>
