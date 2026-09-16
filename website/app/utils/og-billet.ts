// The hero headline's billet relief (app/css/landing.css, `.hero-billet-line`)
// for the social cards (app/components/OgImage). The card renderer has no
// `oklch()`, `color-mix()`, `calc(sin())` or `in oklab`, so the dark scheme's
// chain is baked to numbers here — every value is landing.css's formula at
// its knobs (depth 0.0364em, softness 0.0409em, the 330° lamp, highlight 75,
// shade 55, shading 45, sheen 30, side 40, solidness 45), converted once.
// The one departure is the FILL: the hero's dark fill (oklch 0.44 / 0.36)
// is set for a page, and on a card seen small in a feed it sank into the
// ground, so the cards run it at 0.55 / 0.47 — every rim, wall and cast
// below is re-derived from that fill by the same formulas. Re-tune by
// moving a knob and re-baking, never by editing a number below.
//
// Same two-copy law as the hero: an element's background paints UNDER its
// text-shadow, so the in-flow INK copy carries the shadows and an identical
// FACE copy on top carries the fill clipped to the glyphs.

const LIGHT_ANGLE = 330
const DEPTH = 0.0364
const SOFTNESS = 0.0409
const CRISP = 1 - 45 * 0.009

// --hi / --hi-soft / --lo / --wall / --lo-surf / --lo-cast, as rgba.
const HI = 'rgba(194,196,199,0.919)'
const HI_SOFT = 'rgba(194,196,199,0.3)'
const LO = 'rgba(29,31,33,0.505)'
const WALL = 'rgba(50,57,66,0.64)'
const LO_SURF = 'rgba(27,27,27,0.193)'
const LO_CAST = 'rgba(27,27,27,0.138)'

// --glyph-shading, --glyph-sheen and --text-fill.
const FACE = [
  'linear-gradient(330deg, rgba(29,31,33,0.203), rgba(29,31,33,0) 42%, rgba(194,196,199,0) 58%, rgba(194,196,199,0.248))',
  'linear-gradient(35deg, rgba(194,196,199,0) 32%, rgba(194,196,199,0.195) 50%, rgba(194,196,199,0) 68%)',
  'linear-gradient(165deg, #6f7275, #595b5e)',
].join(', ')

// A hairline stroke on the face, the fill a step darker (oklch l − 0.09),
// so each glyph's boundary reads as the edge of a part and not a wash.
const STROKE = '#56585b'
const STROKE_WIDTH = 0.008

const px = (n: number) => `${n.toFixed(3)}px`

/** The two copies' inline styles for a line set at `fontSize` px. */
export function ogBillet(fontSize: number) {
  const depth = DEPTH * fontSize
  const softness = SOFTNESS * fontSize
  const lx = Math.sin((LIGHT_ANGLE * Math.PI) / 180) * depth
  const ly = -Math.cos((LIGHT_ANGLE * Math.PI) / 180) * depth
  const sx = lx * -0.06
  const sy = ly * -0.06
  const wallBlur = depth * 0.12 * CRISP
  const rimBlur = softness * 0.35 * CRISP
  const shadows = [
    `${px(lx * 0.5)} ${px(ly * 0.5)} ${px(rimBlur)} ${HI}`,
    `${px(lx)} ${px(ly)} ${px(softness)} ${HI_SOFT}`,
    `${px(lx * -0.5)} ${px(ly * -0.5)} ${px(rimBlur)} ${LO}`,
    ...Array.from({ length: 12 }, (_, i) => `${px(sx * (i + 1))} ${px(sy * (i + 1))} ${px(wallBlur)} ${WALL}`),
    `${px(lx * -1)} ${px(ly * -1)} ${px(softness * 1.2)} ${LO_SURF}`,
    `${px(lx * -2.1)} ${px(ly * -2.1)} ${px(softness * 2.8)} ${LO_CAST}`,
  ]
  return {
    ink: `color: transparent; text-shadow: ${shadows.join(', ')};`,
    face: `color: transparent; background-image: ${FACE}; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; -webkit-text-stroke: ${px(STROKE_WIDTH * fontSize)} ${STROKE};`,
  }
}
