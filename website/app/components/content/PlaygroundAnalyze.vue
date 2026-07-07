<script setup lang="ts">
import { api } from '#backend/api'

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
    <div class="analyze">
      <textarea
        v-model="input"
        class="analyze-input"
        rows="3"
        placeholder="Paste or type some text to analyze…"
        aria-label="Text to analyze"
      />
      <div class="analyze-actions">
        <button
          class="analyze-button"
          type="button"
          :disabled="analyzing"
          @click="submit"
        >
          {{ analyzing ? 'Analyzing…' : 'Analyze' }}
        </button>
        <span
          v-if="analyzing"
          class="analyze-pending"
        >
          Running in the Node runtime…
        </span>
      </div>

      <dl
        v-if="result && !analyzing"
        class="analyze-stats"
      >
        <div class="analyze-stat">
          <dt>Characters</dt>
          <dd>{{ result.characters }}</dd>
        </div>
        <div class="analyze-stat">
          <dt>Words</dt>
          <dd>{{ result.words }}</dd>
        </div>
        <div class="analyze-stat">
          <dt>Longest word</dt>
          <dd>{{ result.longestWord || '—' }}</dd>
        </div>
        <div class="analyze-stat">
          <dt>SHA-256</dt>
          <dd :title="result.sha256">
            {{ result.sha256.slice(0, 16) }}…
          </dd>
        </div>
      </dl>

      <p
        v-if="error"
        class="analyze-error"
      >
        {{ error }}
      </p>
    </div>
  </PlaygroundDemo>
</template>

<style scoped>
.analyze {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.analyze-input {
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg);
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
}

.analyze-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.analyze-button {
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.analyze-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.analyze-pending {
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
}

.analyze-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.5rem;
  margin: 0;
}

.analyze-stat {
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-muted);
}

.analyze-stat dt {
  color: var(--ui-text-muted);
  font-size: 0.75rem;
}

.analyze-stat dd {
  margin: 0.125rem 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.analyze-error {
  margin: 0;
  color: var(--ui-color-error-500, #ef4444);
  font-size: 0.8125rem;
}
</style>
