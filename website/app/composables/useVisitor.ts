// The landing page's idea of "you": a short handle other visitors see on
// the rows you write, and a session id the demos key per-browser state on
// (your vote, your presence heartbeat). Both are minted once per tab and
// kept in sessionStorage, so two tabs are two visitors — which is exactly
// what makes "open a second tab" a demonstration rather than a trick.
//
// Client-only by construction: the server always sees the placeholder, and
// the real values land after mount, so the served HTML never carries a
// random token that hydration would have to disagree about.
function mint(length: number) {
  return Math.random().toString(36).slice(2, 2 + length)
}

// A WINDOW OPENED BY SCRIPT STARTS WITH A COPY of its opener's
// sessionStorage (the spec says so, and Chrome and Safari do it), which
// would hand the hero's second window (utils/canvas-window.ts) the same
// session id as the page that opened it — one visitor in two windows, and
// presence would count one. The id is stamped with the name of the window
// that minted it; a copy arriving in a window of another name is re-minted,
// so the popup is the second visitor it is meant to be.
function persisted(key: string, make: () => string) {
  try {
    const stored = sessionStorage.getItem(key)
    if (stored && sessionStorage.getItem(`${key}:window`) === window.name) return stored
    const fresh = make()
    sessionStorage.setItem(key, fresh)
    sessionStorage.setItem(`${key}:window`, window.name)
    return fresh
  }
  catch {
    return make()
  }
}

export const useVisitor = () => {
  const handle = useState<string>('visitor-handle', () => 'you')
  const sid = useState<string>('visitor-sid', () => '')
  onMounted(() => {
    handle.value = persisted('nc-visitor-handle', () => `you-${mint(3)}`)
    sid.value = persisted('nc-visitor-sid', () => mint(12))
  })
  return { handle, sid }
}
