<script setup lang="ts">
const { user, client } = useBetterAuth()
const signOut = () => client.signOut()
</script>

<template>
  <p>{{ user?.email ?? 'signed out' }}</p>
  <button @click="signOut">
    Sign out
  </button>
</template>
