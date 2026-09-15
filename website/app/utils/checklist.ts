import type { InjectionKey, Ref } from 'vue'

/** What `::checklist` provides to each `:::checklist-item`. */
export const ChecklistKey: InjectionKey<{
  checked: Ref<boolean[]>
  register: () => number
  toggle: (index: number, value: boolean) => void
}> = Symbol('checklist')
