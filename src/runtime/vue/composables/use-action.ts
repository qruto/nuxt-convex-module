import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from 'convex/server'
import { makeFunctionReference } from 'convex/server'
import type { Value } from 'convex/values'
import { useConvexOrThrow, type ConvexVueClient } from '../client'

/**
 * An interface to execute a Convex action on the server.
 *
 * @public
 */
export interface VueAction<Action extends FunctionReference<'action'>> {
  /**
   * Execute the function on the server, returning a `Promise` of its return value.
   *
   * @param args - Arguments for the function to pass up to the server.
   * @returns The return value of the server-side function call.
   * @public
   */
  (...args: OptionalRestArgs<Action>): Promise<FunctionReturnType<Action>>
}

function createAction(
  actionReference: FunctionReference<'action'>,
  client: ConvexVueClient,
): VueAction<any> {
  return function (args?: Record<string, Value>): Promise<unknown> {
    return client.action(actionReference, args)
  } as VueAction<any>
}

/**
 * Construct a new {@link VueAction}.
 *
 * Returns a function that you can call to execute a Convex action. Actions
 * can call third-party APIs and perform side effects. The returned function
 * is stable for the lifetime of the composable (same reference identity).
 *
 * **Error handling:** Actions can fail (e.g., if an external API is down).
 * Always wrap action calls in try/catch or handle the rejected promise.
 *
 * **Note:** In most cases, calling an action directly from a client is an
 * anti-pattern. Prefer having the client call a mutation that captures the
 * user's intent (by writing to the database) and then schedules the action
 * via `ctx.scheduler.runAfter`. This ensures the intent is durably recorded
 * even if the client disconnects.
 *
 * Throws an error if no Convex client has been provided.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useAction } from '#imports'
 * import { api } from '#backend/api'
 *
 * const generate = useAction(api.ai.generateSummary)
 *
 * async function handleClick() {
 *   try {
 *     const summary = await generate({ text: 'Some long text...' })
 *     console.log(summary)
 *   } catch (error) {
 *     console.error('Action failed:', error)
 *   }
 * }
 * </script>
 * ```
 *
 * @param action - A {@link server.FunctionReference} for the public action
 * to run like `api.dir1.dir2.filename.func`.
 * @returns The {@link VueAction} object with that name.
 *
 * @public
 */
export function useAction<Action extends FunctionReference<'action'>>(
  action: Action,
): VueAction<Action> {
  // Upstream: `useContext(ConvexContext)` plus the in-hook undefined check.
  const convex = useConvexOrThrow('useAction')
  const actionReference
    = typeof action === 'string'
      ? makeFunctionReference<'action', any, any>(action)
      : action

  // Upstream wraps this in `useMemo`; a composable runs once per setup, so
  // the call is already stable.
  return createAction(actionReference, convex)
}

/** @public */
export const useConvexAction = useAction
