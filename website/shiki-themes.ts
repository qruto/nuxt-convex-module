// The site's own shiki theme pair — the code palette speaks the same
// language as the chrome around it: neutral ink for structure, the signal
// ramp (app.css --color-signal-*) for the parts that matter. Two hues only;
// no third-party theme's blues/greens on these plates. Wired up in
// nuxt.config.ts — Nuxt Content passes theme OBJECTS straight through to
// shiki, so no bundled-theme registration is involved.
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
    structure: '#737373',
    comment: '#a3a3a3',
    accent: '#c63307',
    string: '#9d2b0e',
    constant: '#7e260f',
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
    structure: '#a3a3a3',
    comment: '#6e6e6e',
    accent: '#ff6f3d',
    string: '#ffa274',
    constant: '#ffc8aa',
    type: '#fafafa',
    property: '#bcbcbc',
    punctuation: '#7c7c7c',
    inserted: '#a3e635',
    deleted: '#f87171',
  }),
}
