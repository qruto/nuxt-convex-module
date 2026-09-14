<script setup lang="ts">
// Overrides Nuxt UI's ProseField (dist/runtime/components/prose/Field.vue,
// 4.11.0) to add a `default` prop: the default value sits in the header
// row after the type, in the same place on every field, instead of in
// the description. Re-diff on a Nuxt UI bump.
import theme from '#build/ui/prose/field'

const props = defineProps<{
  name?: string
  type?: string
  default?: string
  description?: string
  required?: boolean
  class?: string
}>()

const slots = defineSlots<{ default?: () => unknown }>()
const appConfig = useAppConfig()
const ui = computed(() => ({ ...theme.slots, ...(appConfig.ui?.prose?.field?.slots ?? {}) }))
</script>

<template>
  <div :class="[ui.root, props.class]">
    <div :class="ui.container">
      <span
        v-if="props.name"
        :class="ui.name"
      >{{ props.name }}</span>

      <div
        v-if="props.type || props.required || props.default"
        :class="ui.wrapper"
      >
        <span
          v-if="props.type"
          :class="ui.type"
        >{{ props.type }}</span>

        <span
          v-if="props.required"
          :class="ui.required"
        >required</span>

        <span
          v-if="props.default"
          class="field-default ms-auto flex items-center gap-1 text-toned"
        >
          <span class="font-sans text-[0.6875rem] tracking-[0.06em] text-dimmed">default</span>
          <code class="rounded-(--radius-chip) convex-0 px-1.5 py-px text-highlighted">{{ props.default }}</code>
        </span>
      </div>
    </div>

    <div
      v-if="!!slots.default || props.description"
      :class="ui.description"
    >
      <slot mdc-unwrap="p">
        {{ props.description }}
      </slot>
    </div>
  </div>
</template>
