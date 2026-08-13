// The site's own shiki theme pair — the code palette speaks the same
// language as the chrome around it: the signal ramp (app.css
// --color-signal-*) carries syntax, neutral ink carries identifiers and the
// quiet furniture. Two hues only; no third-party theme's blues/greens on
// these plates. Wired up in nuxt.config.ts — Nuxt Content passes theme
// OBJECTS straight through to shiki, so no bundled-theme registration is
// involved.
//
// The chromatic roles reference the ramp TOKENS rather than copies of its
// hexes: shiki emits whatever string it is given into the per-token
// `--shiki-default` / `--shiki-dark` custom properties, so a var() lands in
// CSS and resolves there. (shiki's normalizeTheme swaps any non-`#` value
// for a placeholder hex and restores the original string through
// colorReplacements, which is what makes a var() legal here at all.) That
// keeps the code accents on the live ramp — including its wide-gamut
// (color-gamut: p3) definition, which a baked hex could never follow: on a
// P3 display the syntax gains the same voltage as the chrome, for free.
// Neutrals stay literal: they are the plate's own greys, not brand color.
//
// The four chromatic roles walk the ramp in step order and the two plates
// mirror each other — 600/700/800/900 on light, 500/400/300/200 on dark.
// Keywords take the end of that walk nearest the plate and the API surface
// (functions, tags) the step beyond it, so `const` and `await` read as
// orange while `useConvexQuery` holds more contrast than the keywords around
// it and stays what the eye lands on — which is what a reader is here for.
// Measured against the backgrounds below: accent 4.97:1 light / 5.47:1 dark,
// keywords 3.51:1 / 4.85:1. The light keyword step is the one place this
// trades contrast for hierarchy; it stays crisp because the hue is saturated
// (it is the ramp's most chromatic step), and every role below it climbs.
//
// Typed structurally rather than as shiki's ThemeRegistrationRaw: `shiki` is
// a transitive dependency and the isolated node linker (deliberate, see the
// workspace config) keeps phantom imports out of reach. The literal shape
// below is what shiki's normalizeTheme consumes.
interface ThemeTokenRule {
  scope?: string[]
  settings: { foreground?: string, fontStyle?: string }
}

interface SignalTheme {
  name: string
  type: 'light' | 'dark'
  colors: Record<string, string>
  settings: ThemeTokenRule[]
}

// Shared scope map: one role table, two color sets. Keeping the scopes in a
// single place guarantees light and dark can never drift apart in coverage.
interface Roles {
  ink: string
  structure: string
  comment: string
  accent: string
  string: string
  constant: string
  type: string
  property: string
  punctuation: string
  inserted: string
  deleted: string
}

function tokenColors(c: Roles): ThemeTokenRule[] {
  return [
    { settings: { foreground: c.ink } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: c.comment, fontStyle: 'italic' },
    },
    {
      scope: ['punctuation', 'meta.brace', 'punctuation.separator', 'punctuation.terminator'],
      settings: { foreground: c.punctuation },
    },
    {
      scope: [
        'keyword',
        'keyword.operator',
        'storage.type',
        'storage.modifier',
        'variable.language',
        'constant.other.option',
        'entity.other.attribute-name',
      ],
      settings: { foreground: c.structure },
    },
    {
      scope: ['string', 'punctuation.definition.string', 'constant.other.symbol'],
      settings: { foreground: c.string },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'support.constant'],
      settings: { foreground: c.constant },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'variable.function',
        'entity.name.tag',
        'punctuation.definition.tag',
      ],
      settings: { foreground: c.accent },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.inherited-class',
      ],
      settings: { foreground: c.type },
    },
    {
      scope: [
        'variable.other.property',
        'variable.other.object.property',
        'meta.object-literal.key',
        'support.type.property-name',
      ],
      settings: { foreground: c.property },
    },
    { scope: ['markup.inserted'], settings: { foreground: c.inserted } },
    { scope: ['markup.deleted'], settings: { foreground: c.deleted } },
  ]
}

export const signalLight: SignalTheme = {
  name: 'signal-light',
  type: 'light',
  colors: {
    'editor.background': '#f5f5f5',
    'editor.foreground': '#262626',
  },
  settings: tokenColors({
    ink: '#262626',
    structure: 'var(--color-signal-600)',
    comment: '#a3a3a3',
    accent: 'var(--color-signal-700)',
    string: 'var(--color-signal-800)',
    constant: 'var(--color-signal-900)',
    type: '#171717',
    property: '#404040',
    punctuation: '#8f8f8f',
    inserted: '#4d7c0f',
    deleted: '#b91c1c',
  }),
}

export const signalDark: SignalTheme = {
  name: 'signal-dark',
  type: 'dark',
  colors: {
    'editor.background': '#262626',
    'editor.foreground': '#d4d4d4',
  },
  settings: tokenColors({
    ink: '#d4d4d4',
    structure: 'var(--color-signal-500)',
    comment: '#6e6e6e',
    accent: 'var(--color-signal-400)',
    string: 'var(--color-signal-300)',
    constant: 'var(--color-signal-200)',
    type: '#fafafa',
    property: '#bcbcbc',
    punctuation: '#7c7c7c',
    inserted: '#a3e635',
    deleted: '#f87171',
  }),
}
