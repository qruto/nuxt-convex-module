// The one fact the hero's two halves share: which capability the instrument
// panel is demonstrating right now. The panel writes it (a scene id while the
// recording plays, LIVE once the real query is on the plate); the capability
// legend in the copy reads it and lights the matching entry. Server-side it is
// still null when the legend renders — the copy renders ahead of the plate —
// so the served HTML carries no lit entry and hydration has nothing to
// disagree about; the lamp only ever comes on client-side.
export const useHeroScene = () =>
  useState<string | null>('hero-scene', () => null)
