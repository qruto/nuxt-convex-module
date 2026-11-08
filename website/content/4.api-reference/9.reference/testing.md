---
navigation: true
description: "Helpers for an app's own tests, kept off the runtime entries — generated TypeScript API reference for nuxt-convex-module/testing."
seo:
  title: "API reference: testing"
---

# testing

Helpers for an app's own tests, kept off the runtime entries.

The module keeps some state for the app's lifetime, as upstream's provider
keeps it for the provider's: a test that signs in leaves it behind for the
next. Reset it here instead of reaching into the module's files by path.

Load it where the app's runtime loads, in `@nuxt/test-utils`' `nuxt`
environment: it imports `#convex/auth-client`, the alias the module (or
your test config) registers.

```ts
import { afterEach } from 'vitest'
import { resetBetterAuthState } from 'nuxt-convex-module/testing'

afterEach(() => resetBetterAuthState())
```

## Functions

### resetBetterAuthState()

```ts
function resetBetterAuthState(): void;
```

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:369](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L369)

Forget what the Better Auth integration keeps for the app's lifetime: the
browser's token cache and its session subscription. Published from
`nuxt-convex-module/testing`; call it between tests that sign in.

#### Returns

`void`
