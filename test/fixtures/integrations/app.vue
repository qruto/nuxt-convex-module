<script setup lang="ts">
// One piece of each integration, so its runtime ends up in the server bundle.
const { isLoading } = useBetterAuth()
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
    <CheckoutLink :product-ids="['placeholder']">
      Upgrade
    </CheckoutLink>
  </main>
</template>
