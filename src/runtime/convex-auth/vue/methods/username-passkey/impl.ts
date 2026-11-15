/**
 * Internal building blocks of the passkey composables (see `./index.ts`):
 * the autofill request loop, and the modal ceremony slot of a page. A port
 * of `@convex-dev/auth`'s `methods/username-passkey/react_impl.tsx`. They
 * are not part of the public API.
 */
import { onMounted, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref, type ShallowRef } from 'vue'
import type {
  WireAuthenticationResponse,
  WireRequestOptions,
} from '../../../upstream/components/passkey/validation'
import {
  foldClientError,
  type PasskeyClientFailure,
  type ResolvedPasskeyCeremonies,
  type PasskeyClientError,
} from '../../../upstream/methods/username-passkey/ceremonies'

// `components/passkey/constants.ts` upstream, which the package does not
// export: the server's TTL of a challenge, 10 minutes.
const CHALLENGE_TTL_MS = 10 * 60 * 1000

// ------------------------------------------------------------------------------
// Autofill
// ------------------------------------------------------------------------------

/**
 * The states of the passkey autofill request, `autofill.status`:
 *
 * - `"idle"`: the flow has not started yet, or autofill is off.
 * - `"waiting"`: the autofill request is pending in the browser.
 * - `"signingIn"`: a picked assertion is being handled (`onAssertion` is
 *   running, usually a server verification).
 * - `"signedIn"`: `onAssertion` reported success and the flow is done.
 * - `"stopped"`: the flow is done without a success (failure, or no
 *   browser support).
 */
export type PasskeyAutofillStatus
  = 'idle' | 'waiting' | 'signingIn' | 'signedIn' | 'stopped'

/**
 * The gates of an autofill flow, which {@link usePasskeyAutofill} returns
 * among its fields.
 * `pauseAutofillFlow()` aborts the in-flight browser request and keeps the
 * loop parked; `resumeAutofillFlow()` lets the loop start a fresh request.
 * The pauses are reference-counted, so two modal flows on one page compose,
 * and they act on the composable, so they survive a restart of the autofill
 * loop.
 *
 * The browser runs one WebAuthn ceremony at a time per page, thus **every**
 * modal ceremony on a page that runs autofill must pause the autofill flow
 * around itself. A ceremony that skips the pause takes the slot from the
 * pending autofill request, which the flow can only answer by stopping.
 *
 * `isAutofillSigningIn()` tells whether the server verifies a passkey that
 * the user picked from the autocompletion list (status `"signingIn"`). A
 * pause cannot stop this step, because the browser ceremony is already over,
 * thus a modal flow must not start during it.
 */
export type PasskeyAutofillGates = {
  pauseAutofillFlow: () => void
  resumeAutofillFlow: () => void
  isAutofillSigningIn: () => boolean
}

// A pending autofill request refreshes its challenge before the server's
// challenge TTL expires. The two-minute margin makes sure the challenge
// that the user finally redeems is never expired.
const AUTOFILL_REFRESH_MS = CHALLENGE_TTL_MS - 2 * 60 * 1000

// How often a pending autofill request compares the age of its challenge
// against `AUTOFILL_REFRESH_MS`. The age is wall-clock time, which a single
// long timer does not track: browsers throttle timers in background tabs,
// and page timers do not advance while the computer sleeps, whereas the
// server's TTL keeps running. The check is a clock read, so checking after
// a short period is cheap.
const AUTOFILL_STALENESS_CHECK_MS = 10 * 1000

// After this many autofill assertions in a row come back as a failure,
// the autofill flow stops instead of asking the browser again.
const MAX_AUTOFILL_FAILURES = 3

/**
 * Handles passkey autofill (i.e. conditional mediation) on a page.
 *
 * This provides a user-friendly passkey UX where users see the list
 * of passkeys they have for the website when selecting the identifier
 * (e.g. username or email) field of the login form. When selecting
 * an account, it directly authenticates with it, without the user
 * having to go through more steps in the application.
 *
 * This composable only handles the behavior. The login form is required to
 * render an `<input autocomplete="… webauthn">` input field.
 */
export function usePasskeyAutofill<E = never>(options: {
  /**
   * Set `false` to keep the autofill request off. Defaults to `true`.
   */
  enabled?: MaybeRefOrGetter<boolean>
  /**
   * The passkey ceremonies of the platform.
   */
  ceremonies: ResolvedPasskeyCeremonies
  /**
   * Mint fresh options (with a fresh challenge) for a
   * conditional-mediation request, usually through the start mutation of
   * the flow (the `startAutofillSignInWithUsernamePasskey` mutation of a passkey recipe).
   */
  start: () => Promise<WireRequestOptions>
  /**
   * Handle the assertion of the passkey the user picked, usually by
   * sending it to the flow's finish mutation. Return `success: false` with
   * the flow's error to make the loop retry with a fresh challenge (up to
   * a small cap); return `success: true` to end the flow as `"signedIn"`.
   */
  onAssertion: (
    response: WireAuthenticationResponse,
  ) => Promise<{ success: true } | { success: false, userError: E }>
}): {
  /**
   * Whether the browser can offer passkeys in the autocompletion list.
   * `null` while detection runs; `false` when autofill is off.
   */
  available: Ref<boolean | null>
  /** The state of the request; see {@link PasskeyAutofillStatus}. */
  status: Ref<PasskeyAutofillStatus>
  /** The most recent failure, for display or logging. */
  lastError: ShallowRef<E | PasskeyClientError | null>
} & PasskeyAutofillGates {
  // The implementation flows from the following constraints:
  // - While usePasskeyAutofill is mounted, we (generally) have an ongoing
  //   conditional mediation request running.
  // - We start a new request once the challenge is ~8 minutes old (by the
  //   wall clock) because the challenge has a TTL of 10 minutes.
  // - The autofill system can be paused and then resumed. This is necessary
  //   because the browser doesn’t allow you to have concurrent WebAuthn
  //   challenges, so we need to pause autofill while a modal passkey
  //   challenge is running.

  const { enabled = true, ceremonies } = options

  const available = ref<boolean | null>(null)
  const status = ref<PasskeyAutofillStatus>('idle')
  const lastError = shallowRef<E | PasskeyClientError | null>(null)

  // Reference-counted pauses, so that two modal flows on one page compose:
  // the first one to resume must not restart the loop while the second
  // still holds the ceremony slot. The count lives on the composable, so a
  // pause holds across a restart of the loop.
  let pauseCount = 0
  // Wakes the parked loop; `null` while the loop is not parked.
  let wake: (() => void) | null = null
  // The `AbortController` of the conditional request that this composable
  // has in flight, or `null` when it has none. The composable owns it, rather
  // than letting `@simplewebauthn/browser` own the ceremony slot, because an
  // `AbortSignal` latches: an abort holds whether it arrives before, during,
  // or after the `get()` call, so `pause` needs no acknowledgement from the
  // loop and no ordering rule. It is also how the loop knows *who* ended a
  // request: this composable aborts this controller and nobody else does, so
  // an abort here is never another ceremony taking the browser's ceremony
  // slot.
  let controller: AbortController | null = null
  // `true` while `onAssertion` runs. Not the `status` ref, so that a modal
  // flow started in the same tick as the pick sees it.
  let signingIn = false

  const pauseAutofillFlow = () => {
    pauseCount += 1
    controller?.abort()
  }

  const resumeAutofillFlow = () => {
    pauseCount = Math.max(0, pauseCount - 1)
    if (pauseCount === 0) {
      wake?.()
    }
  }

  const isAutofillSigningIn = () => signingIn

  // Upstream runs the loop in an effect. The watcher starts once the
  // component has mounted, which is when an effect first runs, so nothing
  // here changes what a server-rendered page hydrates with.
  onMounted(() => watch(() => toValue(enabled), (isEnabled, _was, onCleanup) => {
    if (!isEnabled) {
      // Report the off state, so `status` does not stay stuck on the last
      // value of a previous enabled run.
      status.value = 'idle'
      // No detection runs and the autocompletion list will not offer
      // passkeys. Report `false`, so `available` does not stay on `null`
      // ("detection runs") forever.
      available.value = false
      return
    }
    // The cleanup flips this: a loop that outlives its run sees
    // `alive: false` after its next await and exits.
    let alive = true

    /** Park until `resume()` or the cleanup wakes us. */
    const park = () =>
      new Promise<void>((resolve) => {
        wake = () => {
          wake = null
          resolve()
        }
      })

    const runLoop = async () => {
      // Feature-detect autofill through the ceremonies of the platform. Count
      // a rejection as "not available": if it escaped, the promise chain
      // below would reject unhandled and the composable would stay on
      // `available: null` and `status: "idle"` forever.
      let supported = false
      try {
        supported = await ceremonies.isAutofillAvailable()
      }
      catch {
        // Keep `supported` as `false`.
      }
      if (!alive) {
        return
      }
      available.value = supported
      if (!supported) {
        status.value = 'stopped'
        return
      }

      let failures = 0
      while (alive) {
        if (pauseCount > 0) {
          await park()
          continue
        }

        status.value = 'waiting'
        // Taken before the start mutation runs, so the age this loop
        // measures is never shorter than the age the server measures.
        const requestedAt = Date.now()
        let requestOptions
        try {
          requestOptions = await options.start()
        }
        catch (cause) {
          if (!alive) {
            return
          }
          lastError.value = foldClientError(cause)
          status.value = 'stopped'
          return
        }
        if (!alive) {
          return
        }
        if (pauseCount > 0) {
          // A pause came in while the challenge was being minted: park (at
          // the top of the loop) before a new browser request starts.
          continue
        }

        // Published before the request starts, and nothing yields between
        // the gate check above and this line, so no pause can land in
        // between. From here on the abort itself covers every interleaving:
        // an `AbortSignal` latches, thus a pause that arrives while the
        // request is still starting up aborts it just as well as one that
        // arrives while it is pending, and `get()` refuses an
        // already-aborted signal on entry.
        const request = new AbortController()
        controller = request

        // Refresh before the server's challenge TTL, so the challenge
        // that the user finally redeems is never expired. A refresh that
        // fires while the user is resolving the ceremony does not discard
        // the result: the challenge the user redeemed is still inside its
        // TTL, and `get()` resolves with the assertion rather than with the
        // abort.
        //
        // The age is read from the wall clock, periodically and whenever
        // the user comes back to the page, instead of from one timer set
        // to `AUTOFILL_REFRESH_MS`: such a timer fires late in a throttled
        // background tab, and it does not count the time the computer
        // sleeps, which would leave an expired challenge pending on a page
        // that sat idle.
        const refreshIfStale = () => {
          if (Date.now() - requestedAt >= AUTOFILL_REFRESH_MS) {
            request.abort()
          }
        }
        const refreshTimer = setInterval(
          refreshIfStale,
          AUTOFILL_STALENESS_CHECK_MS,
        )
        const stopResumeChecks = ceremonies.onResume(refreshIfStale)

        const result = await ceremonies.authenticateWithAutofill(
          requestOptions,
          request.signal,
        )
        if (controller === request) {
          controller = null
        }
        clearInterval(refreshTimer)
        stopResumeChecks()
        if (!alive) {
          return
        }

        if (!result.success) {
          if (request.signal.aborted) {
            // This composable ended its own request: a refresh, or a pause.
            // The two need no telling apart, because the top of the loop
            // parks if a pause is still owed and otherwise starts a request
            // with a fresh challenge, which is what both want.
            continue
          }
          // Nothing this composable did ended the request, so another
          // WebAuthn ceremony took the browser's single ceremony slot, or the
          // browser refuses conditional requests outright. The two are
          // indistinguishable, and starting a fresh request would abort
          // whatever holds the slot (or spin against a browser that
          // refuses), so the flow stops and says so.
          if (result.userError.error === 'CEREMONY_ABORTED') {
            // What this composable tells a developer whose own ceremony took
            // the browser's single ceremony slot without pausing the flow
            // first. Upstream keeps the text in `FOREIGN_CEREMONY_WARNING`;
            // here it is in the call, where the docs contract reads it.
            console.warn(
              '[convex-auth] The passkey autofill request was ended by another WebAuthn '
              + 'ceremony, so autofill has stopped. A page that runs passkey autofill must '
              + 'run every one of its modal ceremonies through the passkey composables, so '
              + 'that autofill yields the browser\'s single ceremony slot instead of '
              + 'competing for it.',
            )
          }
          lastError.value = result.userError
          status.value = 'stopped'
          return
        }

        status.value = 'signingIn'
        signingIn = true
        let outcome
        try {
          outcome = await options.onAssertion(result.response)
        }
        catch (cause) {
          if (!alive) {
            return
          }
          lastError.value = foldClientError(cause)
          status.value = 'stopped'
          return
        }
        finally {
          signingIn = false
        }
        if (!alive) {
          return
        }
        if (outcome.success) {
          // A failed attempt earlier in this loop can have set
          // `lastError`. The flow succeeded, so clear it.
          lastError.value = null
          status.value = 'signedIn'
          return
        }
        lastError.value = outcome.userError
        failures += 1
        if (failures >= MAX_AUTOFILL_FAILURES) {
          status.value = 'stopped'
          return
        }
        // Try again with a fresh challenge.
      }
    }

    void runLoop()

    onCleanup(() => {
      alive = false
      controller?.abort()
      // Never leave the loop parked; it exits on `alive`.
      wake?.()
    })
  }, { immediate: true }))

  return {
    available,
    status,
    lastError,
    /** Pause the flow; see {@link PasskeyAutofillGates}. */
    pauseAutofillFlow,
    /** Resume the flow; see {@link PasskeyAutofillGates}. */
    resumeAutofillFlow,
    /** See {@link PasskeyAutofillGates}. */
    isAutofillSigningIn,
  }
}

// ------------------------------------------------------------------------------
// Modal ceremony slot
// ------------------------------------------------------------------------------

/**
 * A call on a flow whose previous call still runs. The first flow keeps
 * its browser dialog and resolves as usual, thus a caller that gets this
 * shows nothing.
 */
export type AlreadyPendingError = { error: 'ALREADY_PENDING' }

/**
 * Failure shape for {@link AlreadyPendingError}.
 */
export type AlreadyPendingFailure = {
  success: false
  userError: AlreadyPendingError
}

/**
 * Building block for modal passkey flows: a `run` callback that runs one
 * modal ceremony at a time, plus its `pending` state.
 *
 * `run(fn)` guards the invariants every modal flow needs:
 *
 * - It refuses a second call while one is running and returns an
 *   {@link AlreadyPendingFailure} instead. A second modal ceremony would be
 *   rejected by the browser, and a nested call would deadlock the autofill
 *   pause/resume protocol.
 * - It also refuses a call while the server verifies an autofill sign-in.
 *   That sign-in cannot be paused, and both flows would set a session.
 * - It pauses the autofill flow of the page, when there is one, before
 *   `fn` and resumes it when `fn` is done, whatever the outcome. The
 *   ceremony of `fn` displaces the pending conditional request anyway (the browser runs one ceremony at a
 *   time per page); the pause keeps the autofill loop from starting a new
 *   request mid-ceremony, and the resume restarts it.
 * - It folds every value `fn` throws into the envelope's error arm, so
 *   callers handle every failure through one `userError` switch.
 *
 * `pause()` returns at once and needs no acknowledgement, because the
 * autofill composable aborts its request through an `AbortSignal` it owns,
 * and an `AbortSignal` latches. A pause that lands while a conditional
 * request is still starting up aborts it just as well as one that lands
 * while it is pending: `get()` refuses an already-aborted signal on entry.
 * The pause thus holds for every interleaving, and `fn` never has its
 * ceremony taken by the autofill loop.
 */
export function usePasskeyCeremonySlot(options: {
  /**
   * The gates of the autofill flow of the page, or `null` when the page
   * runs none, which is the case of a settings page.
   */
  autofill: PasskeyAutofillGates | null
}): {
  /** Run `fn` as the one modal ceremony of the page. */
  run: <T>(fn: () => Promise<T>) => Promise<T | PasskeyClientFailure | AlreadyPendingFailure>
  /** `true` while a `run` call is running. */
  pending: Ref<boolean>
} {
  const { pauseAutofillFlow, resumeAutofillFlow, isAutofillSigningIn }
    = options.autofill ?? {}

  const pending = ref(false)

  const run = async <T>(
    fn: () => Promise<T>,
  ): Promise<T | PasskeyClientFailure | AlreadyPendingFailure> => {
    if (pending.value || isAutofillSigningIn?.()) {
      return { success: false, userError: { error: 'ALREADY_PENDING' } }
    }
    pending.value = true
    // The closure holds one pair of gates, so pause and resume act on
    // the same autofill flow. The pauses are counted by the autofill
    // composable itself, so the pair stays balanced even when its loop
    // restarts mid-ceremony.
    pauseAutofillFlow?.()
    try {
      return await fn()
    }
    catch (cause) {
      return { success: false, userError: foldClientError(cause) }
    }
    finally {
      resumeAutofillFlow?.()
      pending.value = false
    }
  }

  return { run, pending }
}
