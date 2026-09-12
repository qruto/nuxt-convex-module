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

function persisted(key: string, make: () => string) {
  try {
    const stored = sessionStorage.getItem(key)
    if (stored) return stored
    const fresh = make()
    sessionStorage.setItem(key, fresh)
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
