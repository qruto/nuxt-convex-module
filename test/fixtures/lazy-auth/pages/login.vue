<script setup lang="ts">
// A sign-in page that imports the client statically, as the docs allow: the
// session must follow it though nothing loads it through `loadAuthClient()`.
import { authClient } from '#convex/auth-client'

const { isAuthenticated, isLoading } = useBetterAuth()
const signIn = () => authClient.signIn.email({ email: 'ada@example.com', password: 'correct horse' })
</script>

<template>
  <p data-test="auth">
    {{ isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out' }}
  </p>
  <button @click="signIn">
    Sign in
  </button>
  <NuxtLink to="/dashboard">
    Dashboard
  </NuxtLink>
</template>
