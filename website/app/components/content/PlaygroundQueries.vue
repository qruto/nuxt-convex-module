<script setup lang="ts">
// fallow-ignore-next-line unresolved-import -- workspace subpath resolves via the stub dist at dev time; fallow can't follow it
import type { RequestForQueries } from 'nuxt-convex-module/client'
import { api } from '#convex/api'

// `useQueries` subscribes to a *dynamic* set of queries: the checkboxes below
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
    <div class="queries">
      <div class="queries-toggles">
        <label class="queries-toggle">
          <input
            v-model="watchMessages"
            type="checkbox"
          >
          Message count
        </label>
        <label class="queries-toggle">
          <input
            v-model="watchTasks"
            type="checkbox"
          >
          Task stats
        </label>
      </div>

      <p
        v-if="activeKeys.length === 0"
        class="queries-empty"
      >
        No active subscriptions — check a box to subscribe.
      </p>
      <ul
        v-else
        class="queries-list"
      >
        <li
          v-for="key in activeKeys"
          :key="key"
          class="queries-item"
        >
          <span class="queries-label">{{ labels[key] }}</span>
          <span
            v-if="results[key] === undefined"
            class="queries-loading"
          >
            loading…
          </span>
          <span
            v-else-if="isError(results[key])"
            class="queries-error"
          >
            {{ results[key].message }}
          </span>
          <span
            v-else
            class="queries-value"
          >
            {{ formatValue(key, results[key]) }}
          </span>
        </li>
      </ul>
    </div>
  </PlaygroundDemo>
</template>

<style scoped>
.queries-toggles {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.queries-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.queries-empty {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.queries-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.queries-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg);
  font-size: 0.875rem;
}

.queries-label {
  font-weight: 500;
}

.queries-loading {
  color: var(--ui-text-muted);
}

.queries-error {
  color: var(--ui-color-error-500, #ef4444);
  font-size: 0.8125rem;
}

.queries-value {
  font-variant-numeric: tabular-nums;
}
</style>
