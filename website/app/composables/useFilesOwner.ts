// The id the file-storage demo files this browser's uploads under. Each
// browser lists only its own uploads (convex/files.ts), so the id lives in
// localStorage: every window of this browser shares it, which keeps
// "open a second window" live, and no other browser can list what it
// uploaded. Client-only: the server sees `null`, and the demo waits for the
// real id after mount.
const KEY = 'nc-files-owner'
const OWNER = /^[0-9a-f-]{36}$/

export const useFilesOwner = () => {
  const owner = useState<string | null>('files-owner', () => null)
  onMounted(() => {
    if (owner.value) return
    try {
      const stored = localStorage.getItem(KEY)
      if (stored && OWNER.test(stored)) {
        owner.value = stored
        return
      }
      const fresh = crypto.randomUUID()
      localStorage.setItem(KEY, fresh)
      owner.value = fresh
    }
    catch {
      owner.value ??= crypto.randomUUID()
    }
  })
  return owner
}
