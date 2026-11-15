import type { EmptyObject } from 'convex-helpers'
import type { SessionId } from 'convex-helpers/server/sessions'
import type { FunctionReference } from 'convex/server'
import { expectTypeOf, test } from 'vitest'
import type { SessionArgsArray, SessionQueryArgsArray } from '../../src/runtime/convex-helpers/vue/sessions'

// The type scenarios of upstream's `react/sessions.test.ts`, unchanged.

test('session argument types', () => {
  expectTypeOf<
    SessionQueryArgsArray<
      FunctionReference<'query', 'public', { arg: string, sessionId: SessionId | null }, unknown>
    >
  >().toEqualTypeOf<[{ arg: string } | 'skip']>()

  expectTypeOf<
    SessionQueryArgsArray<
      FunctionReference<'query', 'public', { arg?: string, sessionId: SessionId | null }, unknown>
    >
  >().toEqualTypeOf<[args?: { arg?: string } | 'skip']>()

  expectTypeOf<
    SessionQueryArgsArray<
      FunctionReference<'query', 'public', { sessionId: SessionId | null }, unknown>
    >
  >().toEqualTypeOf<[args?: EmptyObject | 'skip' | undefined]>()

  expectTypeOf<
    SessionArgsArray<
      FunctionReference<'mutation', 'public', { arg: string, sessionId: SessionId }, unknown>
    >
  >().toEqualTypeOf<[{ arg: string }]>()

  expectTypeOf<
    SessionArgsArray<
      FunctionReference<'mutation', 'public', { arg?: string, sessionId: SessionId }, unknown>
    >
  >().toEqualTypeOf<[args?: { arg?: string }]>()

  expectTypeOf<
    SessionArgsArray<
      FunctionReference<'mutation', 'public', { sessionId: SessionId }, unknown>
    >
  >().toEqualTypeOf<[args?: EmptyObject | undefined]>()

  expectTypeOf<
    SessionArgsArray<
      FunctionReference<'query', 'public', { arg: string, sessionId: SessionId }, unknown>
    >
  >().toEqualTypeOf<[{ arg: string }]>()

  expectTypeOf<
    SessionArgsArray<
      FunctionReference<'query', 'public', { sessionId: SessionId }, unknown>
    >
  >().toEqualTypeOf<[args?: EmptyObject | undefined]>()
})
