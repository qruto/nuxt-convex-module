<script setup lang="ts">
import type { Id } from '#backend/dataModel'
import { api } from '#backend/api'
// fallow-ignore-next-line unresolved-import -- workspace subpath resolves via the stub dist at dev time; fallow can't follow it
import { insertAtTop, optimisticallyUpdateValueInPaginatedQuery } from '@qruto/nuxt-convex/vue'

// Paginated task list: 5 items per page, growing as `loadMore` is called.
// `results`, `status`, and `isLoading` are ComputedRefs; `loadMore` is stable.
const { results, status, isLoading, loadMore } = usePaginatedQuery(
  api.tasks.listPaginated,
  {},
  { initialNumItems: 5 },
)

// Optimistic insert: write a placeholder into the local first page before the
// server answers. The placeholder `_id`/`_creationTime` are replaced when the
// authoritative row syncs back.
const addTask = useMutation(api.tasks.add).withOptimisticUpdate(
  (localStore, args) => {
    insertAtTop({
      paginatedQuery: api.tasks.listPaginated,
      localQueryStore: localStore,
      item: {
        _id: crypto.randomUUID() as Id<'tasks'>,
        _creationTime: Date.now(),
        text: args.text,
        completed: false,
      },
    })
  },
)

// Optimistic toggle: flip `completed` across every loaded page instantly.
const toggleTask = useMutation(api.tasks.toggle).withOptimisticUpdate(
  (localStore, args) => {
    optimisticallyUpdateValueInPaginatedQuery(
      localStore,
      api.tasks.listPaginated,
      {},
      task => task._id === args.id ? { ...task, completed: !task.completed } : task,
    )
  },
)

const seedTasks = useMutation(api.tasks.seed)

const text = ref('')
const error = ref<string>()
const seeding = ref(false)

async function submit() {
  error.value = undefined
  const value = text.value
  text.value = ''
  try {
    await addTask({ text: value })
  }
  catch (e) {
    text.value = value
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function toggle(id: Id<'tasks'>) {
  error.value = undefined
  try {
    await toggleTask({ id })
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

async function seed() {
  error.value = undefined
  seeding.value = true
  try {
    await seedTasks({})
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    seeding.value = false
  }
}
</script>

<template>
  <PlaygroundDemo title="Task list — usePaginatedQuery + optimistic updates">
    <div class="tasks">
      <form
        class="tasks-form"
        @submit.prevent="submit"
      >
        <input
          v-model="text"
          class="tasks-input"
          placeholder="Add a task"
          aria-label="New task"
        >
        <button
          class="tasks-button"
          type="submit"
          :disabled="!text.trim()"
        >
          Add
        </button>
      </form>

      <p
        v-if="status === 'LoadingFirstPage'"
        class="tasks-note"
      >
        Loading tasks…
      </p>
      <ul
        v-else-if="results.length > 0"
        class="tasks-list"
      >
        <li
          v-for="task in results"
          :key="task._id"
        >
          <label
            class="tasks-item"
            :data-completed="task.completed"
          >
            <input
              type="checkbox"
              :checked="task.completed"
              @change="toggle(task._id)"
            >
            <span>{{ task.text }}</span>
          </label>
        </li>
      </ul>
      <div
        v-else
        class="tasks-empty"
      >
        <p class="tasks-note">
          No tasks yet.
        </p>
        <button
          class="tasks-button"
          type="button"
          :disabled="seeding"
          @click="seed"
        >
          {{ seeding ? 'Seeding…' : 'Seed sample tasks' }}
        </button>
      </div>

      <div class="tasks-footer">
        <button
          class="tasks-button"
          type="button"
          :disabled="status !== 'CanLoadMore'"
          @click="loadMore(5)"
        >
          {{ status === 'LoadingMore' ? 'Loading…' : 'Load 5 more' }}
        </button>
        <span class="tasks-status">
          status: <code>{{ status }}</code> · isLoading: <code>{{ isLoading }}</code>
        </span>
      </div>
      <p
        v-if="error"
        class="tasks-error"
      >
        {{ error }}
      </p>
    </div>
  </PlaygroundDemo>
</template>

<style scoped>
.tasks-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tasks-input {
  flex: 1;
  min-width: 8rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg);
  font-size: 0.875rem;
}

.tasks-button {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.tasks-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tasks-list {
  max-height: 16rem;
  overflow-y: auto;
  margin: 0 0 0.75rem;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tasks-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.375rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.tasks-item:hover {
  background: var(--ui-bg-muted);
}

.tasks-item[data-completed='true'] span {
  color: var(--ui-text-muted);
  text-decoration: line-through;
}

.tasks-empty {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tasks-note {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.tasks-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tasks-status {
  color: var(--ui-text-muted);
  font-size: 0.75rem;
}

.tasks-status code {
  font-size: 0.75rem;
}

.tasks-error {
  margin: 0.5rem 0 0;
  color: var(--ui-color-error-500, #ef4444);
  font-size: 0.8125rem;
}
</style>
