<script setup lang="ts">
import FilesBatchUpload from '../playground/files/FilesBatchUpload.vue'
import FilesGallery from '../playground/files/FilesGallery.vue'
import FilesSingleUpload from '../playground/files/FilesSingleUpload.vue'

// File storage, in the three shapes the client offers: `useUpload` for a
// single file, `useUploadQueue` for batches, `useStorageUrl` to resolve a
// served URL from a (possibly null) storage id. Each demo owns its own
// composables so it reads end to end on its own; they share one table, so the
// gallery below picks up whatever either uploader lands.
</script>

<template>
  <PlaygroundDemo title="File storage — useUpload + useUploadQueue + useStorageUrl">
    <div class="flex flex-col gap-4 text-sm">
      <FilesSingleUpload />
      <FilesBatchUpload />
      <FilesGallery />
    </div>
  </PlaygroundDemo>
</template>
