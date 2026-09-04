<script setup lang="ts">
import type { RequestForQueries } from 'nuxt-convex-module/client'
import { api } from '#convex/api'

// `useQueries` subscribes to a *dynamic* set of queries: the switches below
// add and remove entries from the request object, and the composable
// subscribes/unsubscribes on the fly — something a fixed list of `useQuery`
// calls can't do without violating the rules of composables.
const watchMessages = ref(true)
const watchTasks = ref(false)

const request = computed(() => {
  const queries: RequestForQueries = {}
  if (watchMessages.value) {
    queries.messageCount = { query: api.messages.count, args: {} }
  }
  if (watchTasks.value) {
    queries.taskStats = { query: api.tasks.stats, args: {} }
  }
  return queries
})

// A ShallowRef mapping each key to its result: `undefined` while loading,
// an `Error` instance if the query threw, otherwise the value.
const results = useQueries(request)

const activeKeys = computed(() => Object.keys(request.value))

const labels: Record<string, string> = {
  messageCount: 'Message count',
  taskStats: 'Task stats',
}

function isError(value: unknown): value is Error {
  return value instanceof Error
}

function formatValue(key: string, value: unknown): string {
  if (key === 'messageCount') {
    return `${value} message${value === 1 ? '' : 's'}`
  }
  const stats = value as { total: number, completed: number }
  return `${stats.completed} of ${stats.total} tasks completed`
}
</script>

<template>
  <PlaygroundDemo title="Dynamic queries — useQueries">
    <div class="mb-4 flex flex-wrap gap-5">
      <USwitch
        v-model="watchMessages"
        label="Message count"
      />
      <USwitch
        v-model="watchTasks"
        label="Task stats"
      />
    </div>

    <p
      v-if="activeKeys.length === 0"
      class="m-0 text-sm text-muted"
    >
      No active subscriptions — flip a switch to subscribe.
    </p>
    <ul
      v-else
      class="m-0 flex list-none flex-col gap-1.5 p-0"
    >
      <li
        v-for="key in activeKeys"
        :key="key"
        class="convex-0 rounded-[10px] flex items-baseline justify-between gap-3 px-2.5 py-1.5 text-sm"
      >
        <span class="font-medium text-default">{{ labels[key] }}</span>
        <span
          v-if="results[key] === undefined"
          class="text-muted"
        >
          loading…
        </span>
        <span
          v-else-if="isError(results[key])"
          class="text-xs text-error"
        >
          {{ results[key].message }}
        </span>
        <span
          v-else
          class="text-default tabular-nums"
        >
          {{ formatValue(key, results[key]) }}
        </span>
      </li>
    </ul>
  </PlaygroundDemo>
</template>
