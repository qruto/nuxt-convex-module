<script setup lang="ts">
import type { Id } from '#convex/dataModel'
import { api } from '#convex/api'
import { insertAtTop, optimisticallyUpdateValueInPaginatedQuery } from 'nuxt-convex-module/client'

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
    <form
      class="mb-3 flex gap-2"
      @submit.prevent="submit"
    >
      <UInput
        v-model="text"
        placeholder="Add a task"
        aria-label="New task"
        class="min-w-32 flex-1"
      />
      <UButton
        type="submit"
        color="primary"
        :disabled="!text.trim()"
      >
        Add
      </UButton>
    </form>

    <p
      v-if="status === 'LoadingFirstPage'"
      class="m-0 mb-3 text-sm text-muted"
    >
      Loading tasks…
    </p>
    <ul
      v-else-if="results.length > 0"
      class="m-0 mb-3 flex max-h-64 list-none flex-col gap-1 overflow-y-auto p-0"
    >
      <li
        v-for="task in results"
        :key="task._id"
        class="rounded-md px-1.5 py-1 transition-colors hover:bg-elevated"
      >
        <UCheckbox
          :model-value="task.completed"
          :label="task.text"
          :ui="{ label: task.completed ? 'text-muted line-through' : '' }"
          @update:model-value="toggle(task._id)"
        />
      </li>
    </ul>
    <div
      v-else
      class="mb-3 flex flex-wrap items-center gap-3"
    >
      <p class="m-0 text-sm text-muted">
        No tasks yet.
      </p>
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        :loading="seeding"
        @click="seed"
      >
        Seed sample tasks
      </UButton>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        :disabled="status !== 'CanLoadMore'"
        :loading="status === 'LoadingMore'"
        @click="loadMore(5)"
      >
        Load 5 more
      </UButton>
      <span class="text-xs text-muted">
        status: <ProseCode>{{ status }}</ProseCode> · isLoading: <ProseCode>{{ isLoading }}</ProseCode>
      </span>
    </div>
    <p
      v-if="error"
      class="m-0 mt-2 text-xs text-error"
    >
      {{ error }}
    </p>
  </PlaygroundDemo>
</template>
