<script setup lang="ts">
import { insertAtTop } from 'nuxt-convex-module/client'
import { api } from '#convex/api'
import type { Id } from '#convex/dataModel'

// Loads the newest four posts, then four more on each `loadMore`. Every loaded
// page stays live.
const { results, status, loadMore } = usePaginatedQuery(api.posts.list, {}, { initialNumItems: 4 })

// Puts the post at the top of the first page before the server answers.
const send = useMutation(api.posts.send).withOptimisticUpdate((store, post) => {
  insertAtTop({
    paginatedQuery: api.posts.list,
    localQueryStore: store,
    item: { _id: crypto.randomUUID() as Id<'posts'>, _creationTime: Date.now(), ...post },
  })
})

const presets = [
  { emoji: '👋', text: 'hello' },
  { emoji: '🚀', text: 'shipped it' },
  { emoji: '🧡', text: 'love this' },
  { emoji: '👀', text: 'looking' },
]

const { error, run } = useCall()

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <DemoCard title="cursor pagination" icon="layers" :apis="['usePaginatedQuery()', 'insertAtTop()']" :error="error">
    <div class="actions">
      <button
        v-for="preset in presets"
        :key="preset.emoji"
        type="button"
        class="button"
        :aria-label="`Post “${preset.text}”`"
        @click="run(() => send(preset))"
      >
        {{ preset.emoji }}
      </button>
    </div>

    <div class="feed concave">
      <p v-if="status === 'LoadingFirstPage'" class="empty">Loading…</p>
      <p v-else-if="!results.length" class="empty">No posts yet. Tap an emoji.</p>
      <ul v-else>
        <li v-for="post in results" :key="post._id">
          <span>{{ post.emoji }}</span>
          <span class="text">{{ post.text }}</span>
          <!-- The time zone is the reader's, so the label renders on the client. -->
          <time :datetime="new Date(post._creationTime).toISOString()">
            <ClientOnly>{{ formatTime(post._creationTime) }}</ClientOnly>
          </time>
        </li>
      </ul>
    </div>

    <div class="footer">
      <code>status: {{ status }}</code>
      <button type="button" class="button" :disabled="status !== 'CanLoadMore'" @click="loadMore(4)">
        Load 4 more
      </button>
    </div>
  </DemoCard>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 0.5rem;
}

.actions .button {
  flex: 1;
  font-size: 1.1rem;
}

.feed {
  max-height: 14rem;
  overflow-y: auto;
  border-radius: var(--radius-recess);
}

ul {
  margin: 0;
  padding: 0.3rem 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.6rem;
  align-items: baseline;
  padding: 0.35rem 0.8rem;
}

li + li {
  border-top: 1px solid var(--border);
}

.text {
  color: var(--text-strong);
  overflow-wrap: anywhere;
}

time {
  min-width: 8ch;
  color: var(--text-dimmed);
  font-size: 0.75rem;
  text-align: right;
}

.empty {
  padding: 1.2rem;
  color: var(--text-muted);
  text-align: center;
}

.footer {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  padding-left: 0.5rem;
}

.footer code {
  color: var(--text-muted);
  font-size: 0.75rem;
}
</style>
