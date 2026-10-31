<script setup lang="ts">
// test/e2e/ssr-auth.test.ts reads this line from the server render and the
// hydrated page: both must agree on who is signed in.
const { isAuthenticated, isLoading } = useBetterAuth()
</script>

<template>
  <div>better-auth fixture</div>
  <p data-test="auth">
    {{ isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out' }}
  </p>
</template>
