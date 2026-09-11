import type { ComputedRef } from 'vue'
import { expectTypeOf } from 'vitest'
import { useMutation } from '../../src/runtime/vue/composables/use-mutation'
import type { VueMutation } from '../../src/runtime/vue/composables/use-mutation'
import { addTask } from './fixtures'

// Type-level coverage for `useMutation`. These files are never executed: the
// assertions are the compile, and `test:types:lib` runs `vue-tsc` over them.
//
// `withOptimisticUpdate` is why this file exists. Its argument type is an
// intersection whose second half collapses to a string literal when the handler
// returns a promise. That is upstream's trick for turning "optimistic update
// handlers must be synchronous" into a compile error instead of a silent bug —
// the update would be rolled back before the handler resolved. Nothing
// exercised it, so a refactor could have dropped that branch with every runtime
// test still passing.

const mutate = useMutation(addTask)

expectTypeOf(mutate).toEqualTypeOf<VueMutation<typeof addTask>>()

// Calling it: args in, the server function's return type out.
expectTypeOf(mutate({ text: 'write the test' })).toEqualTypeOf<Promise<string>>()

// @ts-expect-error `text` is a string, not a number.
mutate({ text: 42 })

// @ts-expect-error `title` is not an argument of this mutation.
mutate({ title: 'wrong key' })

// @ts-expect-error the mutation requires arguments.
mutate()

// A synchronous handler is accepted, and chaining preserves the mutation type.
expectTypeOf(
  mutate.withOptimisticUpdate((localStore, args) => {
    expectTypeOf(args).toEqualTypeOf<{ text: string }>()
    void localStore
  }),
).toEqualTypeOf<VueMutation<typeof addTask>>()

// @ts-expect-error an async handler is rejected: it would resolve after the
// update had already been rolled back.
mutate.withOptimisticUpdate(async () => {})

// The optimistic-update handler sees the mutation's own argument type, so a
// typo in a key is caught inside the handler too.
mutate.withOptimisticUpdate((localStore, args) => {
  // @ts-expect-error `body` is not an argument of this mutation.
  void args.body
  void localStore
})

// Not a `ComputedRef` — the mutation is a stable callable, not reactive state.
// Guards against someone "harmonising" it with `useQuery`'s shape.
expectTypeOf(mutate).not.toMatchTypeOf<ComputedRef<unknown>>()
