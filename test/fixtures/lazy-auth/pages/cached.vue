<script setup lang="ts">
// Served under an `swr` route rule (nuxt.config.ts): Nitro renders it without
// the visitor's cookie and serves that render to everyone.
const { isAuthenticated, isLoading } = useBetterAuth()
</script>

<template>
  <p data-test="auth">
    {{ isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out' }}
  </p>
</template>
