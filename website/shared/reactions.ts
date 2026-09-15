// THE REACTIONS' NAMES — shared by the hero plate (LiveReactions.vue) and
// the mutation that takes a reaction (convex/reactions.ts), so the two
// agree on what a name is. Every visitor sends as one: a short plain word
// drawn for them on arrival and kept in the browser, which they can type
// over or shuffle. Nothing else is free text — the server adds its word
// filter on top of the check below.

/** The keys, in the deck's order; a reaction's `kind` is an index into this. */
export const KINDS = ['👋', '👀', '🧡', '🚀'] as const

/** Short plain words a visitor is handed on arrival. */
const NAMES = [
  'otter', 'ember', 'pixel', 'lumen', 'quartz', 'comet', 'falcon', 'maple',
  'nimbus', 'raven', 'tundra', 'vortex', 'zephyr', 'cobalt', 'orbit', 'pebble',
  'sable', 'willow', 'kestrel', 'basalt', 'linen', 'harbor', 'juniper', 'delta',
] as const

/** Names a visitor cannot take: they would read as someone official. */
const RESERVED = ['admin', 'convex', 'nuxt', 'vue', 'mod', 'staff', 'system', 'team']

/** Two to seven lowercase letters. */
const NAME = /^[a-z]{2,7}$/

/** A short place name: letters, spaces, hyphens, apostrophes and the odd dot. */
export const CITY = /^[\p{L} .'-]{2,32}$/u

/** A reason to refuse `name`, or `null` if it is fine. */
export function checkName(name: string): string | null {
  if (!NAME.test(name)) return 'a name is 2 to 7 letters'
  if (RESERVED.includes(name)) return `"${name}" is reserved`
  return null
}

/** Another name from the list, never the one just held. */
export function drawName(not?: string): string {
  let name: string
  do name = NAMES[Math.floor(Math.random() * NAMES.length)]!
  while (name === not)
  return name
}
