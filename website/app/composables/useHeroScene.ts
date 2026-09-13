// The fact the hero's two halves may share: which capability the instrument
// panel is showing right now. The panel writes it (a scene id, LIVE once the
// real query is on the plate, null while the socket is down). Server-side it
// is still null when the copy renders — the copy renders ahead of the plate —
// so the served HTML never depends on it and hydration has nothing to
// disagree about.
//
// The keypad in the copy does NOT read it any more (2026-09-12): its keys
// open the guide for each feature, and a key that sinks by itself reads as
// pressed by nobody. It stays for the panel and for whatever wants the
// panel's state next.
export const useHeroScene = () =>
  useState<string | null>('hero-scene', () => null)

// The other direction, should the panel ever play scenes again: a request
// to show one. The counter makes the same id twice a second request.
export interface HeroSceneRequest {
  id: string
  n: number
}
export const useHeroSceneRequest = () =>
  useState<HeroSceneRequest | null>('hero-scene-request', () => null)
