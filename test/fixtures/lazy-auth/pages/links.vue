<script setup lang="ts">
// A header-style link to the sign-in page, which imports the client
// statically: Nuxt prefetches that page's chunk once the link is in view.
const { isAuthenticated, isLoading } = useBetterAuth()
</script>

<template>
  <p data-test="auth">
    {{ isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out' }}
  </p>
  <NuxtLink to="/login">
    Sign in
  </NuxtLink>
</template>
