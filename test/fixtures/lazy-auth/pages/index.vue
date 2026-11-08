<script setup lang="ts">
const { isAuthenticated, isLoading } = useBetterAuth()
</script>

<template>
  <p data-test="auth">
    {{ isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out' }}
  </p>
</template>
