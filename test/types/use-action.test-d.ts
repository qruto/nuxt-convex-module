import { expectTypeOf } from 'vitest'
import { useAction } from '../../src/runtime/vue/composables/use-action'
import type { VueAction } from '../../src/runtime/vue/composables/use-action'
import { summarize } from './fixtures'

const run = useAction(summarize)

expectTypeOf(run).toEqualTypeOf<VueAction<typeof summarize>>()

// Actions return whatever the server function returns, always as a promise.
expectTypeOf(run({ id: 'abc' })).toEqualTypeOf<Promise<{ summary: string }>>()

// @ts-expect-error `id` is a string.
run({ id: 123 })

// @ts-expect-error this action takes arguments.
run()

// @ts-expect-error the action resolves `{ summary: string }`, not a bare string —
// the return type is carried through, not widened to `any`.
useAction(summarize)({ id: 'abc' }).then((result: string) => result)
