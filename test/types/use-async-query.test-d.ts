import type { ComputedRef } from 'vue'
import { expectTypeOf } from 'vitest'
import { useAsyncQuery } from '../../src/runtime/nuxt/composables/use-async-query'
import { listTasks } from './fixtures'
import type { Task } from './fixtures'

// `useAsyncQuery` is Vue-only — it has no upstream counterpart to inherit tests
// from, which makes it the widest divergence risk in the port and the surface
// most worth pinning at the type level.
//
// Its contract is unusual on purpose: the return value is BOTH a bag of refs
// (used synchronously in `setup`) and a `PromiseLike` (awaited for SSR). Losing
// either half is a silent break for one of the two usages.

const query = useAsyncQuery(listTasks, { onlyDone: true })

// The refs half.
expectTypeOf(query.data).toEqualTypeOf<ComputedRef<Task[] | undefined>>()
expectTypeOf(query.error).toEqualTypeOf<ComputedRef<Error | null>>()

// The awaitable half: `await` yields the resolved data shape, not the ref bag.
expectTypeOf(query).toMatchTypeOf<PromiseLike<unknown>>()
expectTypeOf(query.then).toBeFunction()

// Args are optional, and accept the skip sentinel like `useQuery`.
expectTypeOf(useAsyncQuery(listTasks, 'skip').data)
  .toEqualTypeOf<ComputedRef<Task[] | undefined>>()

// Args may be a getter — the SSR fetch reads them once, the live subscription
// tracks them.
expectTypeOf(useAsyncQuery(listTasks, () => ({ onlyDone: false })).data)
  .toEqualTypeOf<ComputedRef<Task[] | undefined>>()

// @ts-expect-error `onlyDone` is a boolean.
useAsyncQuery(listTasks, { onlyDone: 'yes' })

// @ts-expect-error `server` is a boolean option.
useAsyncQuery(listTasks, { onlyDone: true }, { server: 'always' })

// @ts-expect-error `lazyy` is a typo — options are checked, not passed through.
useAsyncQuery(listTasks, { onlyDone: true }, { lazyy: true })
