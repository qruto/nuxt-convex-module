import { execFileSync } from 'node:child_process'

/**
 * Run one labelled step of a check script, streaming its output and throwing
 * on a non-zero exit — so the first failing gate stops the script with that
 * tool's own diagnostics on screen, rather than a wrapper's summary of them.
 *
 * Shared by `check-tarball.mjs` and `check-consumer-types.mjs`: both are
 * sequences of "print a banner, shell out, fail loudly", and both are run by
 * `ci`'s pack job and by hand.
 */
export function step(label, file, args, options = {}) {
  console.log(`── ${label} ${'─'.repeat(Math.max(0, 46 - label.length))}`)
  execFileSync(file, args, { stdio: 'inherit', ...options })
  console.log()
}
