<script setup lang="ts">
import { api } from '#convex/api'

// `useAction` returns a stable callable — a one-shot promise per call,
// not a reactive subscription. This action runs in the Node runtime with
// ~600ms of artificial latency, so the pending state is visible.
const analyze = useAction(api.analyze.text)

interface AnalysisResult {
  characters: number
  words: number
  longestWord: string
  sha256: string
  analyzedAt: number
}

const input = ref('')
const result = ref<AnalysisResult>()
const error = ref<string>()
const analyzing = ref(false)

async function submit() {
  error.value = undefined
  analyzing.value = true
  try {
    result.value = await analyze({ input: input.value })
  }
  catch (e) {
    result.value = undefined
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    analyzing.value = false
  }
}
</script>

<template>
  <PlaygroundDemo title="Text analysis — useAction">
    <div class="flex flex-col gap-3">
      <UTextarea
        v-model="input"
        :rows="3"
        placeholder="Paste or type some text to analyze…"
        aria-label="Text to analyze"
        class="w-full"
      />
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          type="button"
          color="primary"
          :loading="analyzing"
          @click="submit"
        >
          Analyze
        </UButton>
        <span
          v-if="analyzing"
          class="text-xs text-muted"
        >
          Running in the Node runtime…
        </span>
      </div>

      <dl
        v-if="result && !analyzing"
        class="m-0 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2"
      >
        <div class="raised px-2.5 py-2 [--raised-elev:var(--elev-0)] [--raised-radius:10px]">
          <dt class="text-xs text-muted">
            Characters
          </dt>
          <dd class="m-0 mt-0.5 text-sm font-semibold text-default tabular-nums">
            {{ result.characters }}
          </dd>
        </div>
        <div class="raised px-2.5 py-2 [--raised-elev:var(--elev-0)] [--raised-radius:10px]">
          <dt class="text-xs text-muted">
            Words
          </dt>
          <dd class="m-0 mt-0.5 text-sm font-semibold text-default tabular-nums">
            {{ result.words }}
          </dd>
        </div>
        <div class="raised px-2.5 py-2 [--raised-elev:var(--elev-0)] [--raised-radius:10px]">
          <dt class="text-xs text-muted">
            Longest word
          </dt>
          <dd class="m-0 mt-0.5 wrap-anywhere text-sm font-semibold text-default">
            {{ result.longestWord || '—' }}
          </dd>
        </div>
        <div class="raised px-2.5 py-2 [--raised-elev:var(--elev-0)] [--raised-radius:10px]">
          <dt class="text-xs text-muted">
            SHA-256
          </dt>
          <dd
            class="m-0 mt-0.5 wrap-anywhere font-mono text-sm font-semibold text-default"
            :title="result.sha256"
          >
            {{ result.sha256.slice(0, 16) }}…
          </dd>
        </div>
      </dl>

      <p
        v-if="error"
        class="m-0 text-xs text-error"
      >
        {{ error }}
      </p>
    </div>
  </PlaygroundDemo>
</template>
