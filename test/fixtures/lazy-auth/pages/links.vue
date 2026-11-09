<script setup lang="ts">
// A header-style link to the sign-in page, which imports the client
// statically: Nuxt prefetches that page's chunk on hover or focus. Not once
// the link is in view: that waits for an idle callback, which headless
// Chromium on CI sometimes never runs.
const { isAuthenticated, isLoading } = useBetterAuth()
</script>

<template>
  <p data-test="auth">
    {{ isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out' }}
  </p>
  <NuxtLink
    to="/login"
    prefetch-on="interaction"
  >
    Sign in
  </NuxtLink>
</template>
