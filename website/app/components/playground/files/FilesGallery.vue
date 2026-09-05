<script setup lang="ts">
import { api } from '#convex/api'

// The stored result, live: one `useQuery` over the files table, each row
// already carrying the URL its storage id resolves to (the query does that
// server-side, so the gallery renders in one pass).
const files = useQuery(api.files.list, {})
const removeFile = useMutation(api.files.remove)

function formatSize(size: number) {
  return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`
}
</script>

<template>
  <section>
    <h4 class="m-0 mb-2 text-[0.8125rem] font-semibold text-highlighted">
      Gallery — live <ProseCode>useQuery</ProseCode> with resolved URLs
    </h4>
    <p
      v-if="files === undefined"
      class="m-0 text-xs text-muted"
    >
      Loading files…
    </p>
    <p
      v-else-if="files.length === 0"
      class="m-0 text-xs text-muted"
    >
      Nothing stored yet — upload a small image above.
    </p>
    <ul
      v-else
      class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2.5 p-0"
    >
      <li
        v-for="file in files"
        :key="file._id"
        class="convex-0 rounded-[10px] relative flex flex-col gap-1 p-2"
      >
        <img
          v-if="file.type.startsWith('image/') && file.url"
          :src="file.url"
          :alt="file.name"
          class="h-18 w-full rounded-sm bg-default object-cover"
        >
        <span
          v-else
          class="flex h-18 w-full items-center justify-center rounded-sm bg-default text-2xl"
        >📄</span>
        <span
          class="truncate text-xs text-default"
          :title="file.name"
        >{{ file.name }}</span>
        <span class="text-[0.6875rem] text-muted">{{ formatSize(file.size) }}</span>
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="outline"
          square
          class="absolute top-1 right-1"
          :aria-label="`Remove ${file.name}`"
          @click="removeFile({ id: file._id })"
        />
      </li>
    </ul>
  </section>
</template>
