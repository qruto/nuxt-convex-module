<script setup lang="ts">
import { AGENT_PROMPT_LINKS } from '#shared/agent-prompt'

// `:agent-prompt-links` — under the agent prompt, one link per editor that can
// take it pre-filled. The copy button on the prompt itself covers every
// other agent, a terminal Claude Code included.
</script>

<template>
  <p class="my-3 flex flex-wrap items-center gap-2 text-sm text-toned">
    <span>Or open it in</span>
    <UButton
      v-for="link in AGENT_PROMPT_LINKS"
      :key="link.label"
      :to="link.href"
      external
      :icon="link.icon"
      :label="link.label"
      size="xs"
      color="neutral"
      variant="outline"
    />
  </p>
</template>
