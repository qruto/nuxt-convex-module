import type { PackageManager } from '#shared/package-managers'
import { PACKAGE_MANAGERS } from '#shared/package-managers'

// The reader's package manager, chosen once in the docs sidebar and kept in
// localStorage. Every `:pm-*` block renders the one command for it, so the
// pages carry no tab strips. SSR renders the default; the stored choice is
// applied on mount, the same way Nuxt UI's own `sync` code groups do. The
// commands themselves live in shared/package-managers.ts.
const STORAGE_KEY = 'nc-package-manager'

const isPackageManager = (value: unknown): value is PackageManager =>
  PACKAGE_MANAGERS.includes(value as PackageManager)

export function usePackageManager() {
  const pm = useState<PackageManager>(STORAGE_KEY, () => 'pnpm')

  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isPackageManager(stored)) pm.value = stored
    }
    catch {
      // Private mode or blocked storage — the default stands.
    }
  })

  function set(value: PackageManager) {
    pm.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    }
    catch {
      // Same as above: the choice lives for the session only.
    }
  }

  return { pm, set }
}
