<template>
  <div>
    <h1>basic</h1>
    <!-- `useQuery` renders undefined during SSR (loading) by design. -->
    <div data-test="live">
      {{ tasks === undefined ? 'live-loading' : 'live-ready' }}
    </div>
    <!-- `useAsyncQuery` puts real data into the SSR HTML. -->
    <div data-test="async-data">
      {{ greeting ?? 'no-data' }}
    </div>
    <div data-test="async-status">
      {{ status }}
    </div>
  </div>
</template>

<script setup>
// Everything here is auto-imported — that's part of what the e2e asserts.
const tasks = useQuery('tasks:list', {})
const { data: greeting, status } = useAsyncQuery('greetings:get', {}, { key: 'e2e:greeting' })
</script>
