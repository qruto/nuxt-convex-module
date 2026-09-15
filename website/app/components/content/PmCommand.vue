<script setup lang="ts">
// One shell block that follows the sidebar's package-manager choice. The
// `:pm-install` / `:pm-x` / `:pm-run` MDC components build their lines and
// hand them here; ProsePre supplies the copy button and the docs' code-well
// theme, so this stays a thin wrapper.
const props = defineProps<{ lines: string[] }>()
const code = computed(() => props.lines.join('\n'))
</script>

<template>
  <!-- Inside a <pre> every line break is content, so the lines sit flush. -->
  <!-- eslint-disable vue/multiline-html-element-content-newline -->
  <ProsePre
    :code="code"
    language="bash"
    class="pm-command"
  ><span
    v-for="(line, index) in lines"
    :key="index"
    class="line"
  >{{ line }}</span></ProsePre>
</template>
