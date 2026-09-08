import type { ComputedRef } from 'vue'
import { ref } from 'vue'
import { expectTypeOf } from 'vitest'
import { useQuery } from '../../src/runtime/vue/composables/use-query'
import { countTasks, listTasks } from './fixtures'
import type { Task } from './fixtures'

// `useQuery` returns a lazy `ComputedRef`, which is this port's central
// divergence from convex/react: upstream's hook throws inside the hook call,
// this one throws when `.value` is read. The `| undefined` in the result type
// is what makes that safe to consume, so it is pinned here.

expectTypeOf(useQuery(listTasks, { onlyDone: true }))
  .toEqualTypeOf<ComputedRef<Task[] | undefined>>()

// A no-argument query takes no second argument.
expectTypeOf(useQuery(countTasks)).toEqualTypeOf<ComputedRef<number | undefined>>()

// Args accept a ref or a getter — the Vue translation of upstream's
// re-render-on-change, and the reason the signature is `MaybeRefOrGetter`
// rather than a plain object.
expectTypeOf(useQuery(listTasks, ref({ onlyDone: false })))
  .toEqualTypeOf<ComputedRef<Task[] | undefined>>()
expectTypeOf(useQuery(listTasks, () => ({ onlyDone: false })))
  .toEqualTypeOf<ComputedRef<Task[] | undefined>>()

// `'skip'` suspends the subscription without changing the result type.
expectTypeOf(useQuery(listTasks, 'skip'))
  .toEqualTypeOf<ComputedRef<Task[] | undefined>>()

// @ts-expect-error `onlyDone` is a boolean.
useQuery(listTasks, { onlyDone: 'yes' })

// @ts-expect-error `'skp'` is a typo, not the skip sentinel.
useQuery(listTasks, 'skp')

// @ts-expect-error this query requires arguments.
useQuery(listTasks)

// The result is never non-optional: a consumer must handle "not loaded yet".
expectTypeOf(useQuery(listTasks, { onlyDone: true }).value).toEqualTypeOf<Task[] | undefined>()
