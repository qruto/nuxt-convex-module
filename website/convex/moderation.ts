// Guardrails for the public demo table.
//
// `messages` is written straight from the marketing homepage by anyone who
// loads it, and every visitor reads the same rows — so a single defacement is
// visible to everyone until someone clears the table. This module is the
// filter that stands in front of that.
//
// Two passes, because the two threats are different shapes:
//
//   A. WORDS — ordinary abusive text. Matched per token, so `document` can't
//      trip a `cum` rule and `manuscript` can't trip an `anus` rule. Handles
//      casing, punctuation, leetspeak (`sh1t`) and stretching (`shiiiit`).
//   B. EVASION — the same words with separators wedged in (`f-u-c-k`,
//      `f u c k`, `f.....k`). Matched against the text with every non-letter
//      removed, so a small, carefully chosen set of patterns only. Anything
//      whose letters can appear inside an innocent word stays out of this
//      pass and lives in A instead.
//
// Blunt on purpose. A false positive costs one rejected demo message; a false
// negative puts a slur in the hero panel.

/** Case, accents and leetspeak folded away; everything else left in place. */
function fold(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    // Combining diacritical marks, left behind by NFKD: `ｆùçk` → `fuck`.
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[4@]/g, 'a')
    .replace(/[3€]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/[69]/g, 'g')
    .replace(/\(/g, 'c')
}

/** `shiiiit` → `shit`. Applied per token so it can't fuse separate words. */
const collapse = (token: string) => token.replace(/(.)\1+/g, '$1')

/**
 * PASS A — whole tokens. Safe to be broad here: nothing matches unless the
 * entire word matches, so short entries can't hide inside longer words.
 *
 * A token is tested both as-written and de-duplicated, so `shiiit` is caught
 * by `shit`. Entries are therefore the NATURAL spellings — never the collapsed
 * form of something whose collapse is itself an English word. `ass` must not
 * be stored as `as`, or the sentence "rendered as expected" gets rejected.
 */
const BLOCKED_WORDS = new Set([
  'fuck', 'fucker', 'fucking', 'fuk', 'fuc', 'motherfucker', 'mofo',
  'shit', 'shitty', 'bullshit', 'crap', 'piss',
  'cunt', 'bitch', 'whore', 'slut', 'hoe', 'skank',
  'dick', 'dik', 'cock', 'pussy', 'twat', 'wank', 'wanker', 'jizz',
  'cum', 'anus', 'arse', 'ass', 'asses', 'asshole', 'assholes',
  'bastard', 'bollocks',
  'nigger', 'nigga', 'faggot', 'fag', 'kike', 'chink',
  'spic', 'wetback', 'trannies', 'tranny', 'retard', 'retarded', 'spastic',
  'rape', 'rapist', 'kys',
  'porn', 'pornhub', 'nsfw', 'onlyfans', 'nude', 'nudes',
  'viagra', 'cialis', 'casino', 'backlink', 'backlinks',
])

/**
 * PASS B — separator evasion. Every pattern here was picked because its
 * letters do not occur consecutively inside ordinary English. The `+`
 * quantifiers absorb stretching; the carve-outs below handle the few real
 * collisions (`Scunthorpe`, `Nigeria`).
 *
 * Note the `{2,}` rather than `g+g+`: two adjacent `+` groups over the same
 * character are ambiguous, and an attacker-supplied run of `g`s would make the
 * engine backtrack super-linearly. `{2,}` is both safer and more precise.
 */
const EVASION_PATTERNS: RegExp[] = [
  /f+u+c+k+/,
  // `(?<!s)` is the Scunthorpe carve-out — without it, "scunthorpe" (and any
  // other s-c-u-n-t word) trips this in the de-spaced pass.
  /(?<!s)c+u+n+t+/,
  // Requiring a doubled `g` also excludes "Niger" / "Nigeria" outright.
  /n+i+g{2,}(?:e+r+|a+)/,
  /f+a+g{2,}o+t+/,
  /k+i+k+e+s?(?!r)/,
  /c+h+i+n+k+/,
  /r+e+t+a+r+d+/,
  /w+h+o+r+e+/,
  /b+i+t+c+h+/,
  /k+y+s+(?:e+l+f+)?$/,
]

/**
 * Links are the other half of the problem: the table is public and
 * permanently on the homepage, which makes it a free backlink farm.
 */
const LINKISH: RegExp[] = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9-]+\.(?:com|net|org|io|dev|xyz|ru|cn|info|biz|top|link|click|shop|online)\b/i,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
]

/** Public-demo limits — much tighter than a real app would use. */
export const LIMITS = {
  body: 140,
  author: 24,
} as const

/** PASS A — any whole token, as written or de-stretched, is a blocked word. */
function hasBlockedWord(folded: string): boolean {
  return folded
    .split(/[^a-z]+/)
    .some(token => token !== '' && (BLOCKED_WORDS.has(token) || BLOCKED_WORDS.has(collapse(token))))
}

/** PASS B — a blocked word survives once every non-letter is removed. */
function hasEvasion(folded: string): boolean {
  const dense = folded.replace(/[^a-z]/g, '')
  return EVASION_PATTERNS.some(pattern => pattern.test(dense))
}

const looksLikeLink = (text: string) => LINKISH.some(pattern => pattern.test(text))

/**
 * Returns a human-readable reason to reject, or `null` to accept.
 * The caller throws; the landing page surfaces it as "SEND REJECTED".
 */
export function rejectMessage(author: string, body: string): string | null {
  const trimmedBody = body.trim()

  if (trimmedBody === '') return 'Message body must not be empty.'
  if (trimmedBody.length > LIMITS.body) {
    return `Message body must be at most ${LIMITS.body} characters.`
  }
  if (author.trim().length > LIMITS.author) {
    return `Author must be at most ${LIMITS.author} characters.`
  }

  // A wall of one repeated character reads as vandalism, not a demo message.
  if (/(.)\1{9,}/.test(trimmedBody)) {
    return 'Message looks like spam.'
  }

  if (looksLikeLink(trimmedBody) || looksLikeLink(author)) {
    return 'Links and addresses are not allowed in the public demo.'
  }

  const folded = fold(`${author} ${trimmedBody}`)
  if (hasBlockedWord(folded) || hasEvasion(folded)) {
    return 'Message was rejected by the public demo filter.'
  }

  return null
}
