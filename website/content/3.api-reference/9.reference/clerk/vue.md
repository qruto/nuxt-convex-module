---
navigation: true
---

# clerk/vue

Convex + Clerk integration for Vue.

A Vue/Nuxt port of `convex/react-clerk`'s `ConvexProviderWithClerk`. It adapts
`@clerk/vue`'s `useAuth()` into the generic Convex auth provider
([provideConvexAuth](/api-reference/reference/vue#provideconvexauth)) — no new auth core, just the SDK shim.

## Interfaces

### ClerkAuthRefs

Defined in: src/runtime/clerk/vue/index.ts:24

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="isloaded"></a> `isLoaded` | `ComputedRef`\<`boolean`\> | src/runtime/clerk/vue/index.ts:25 |
| <a id="issignedin"></a> `isSignedIn` | `ComputedRef`\<`boolean` \| `undefined`\> | src/runtime/clerk/vue/index.ts:26 |
| <a id="gettoken"></a> `getToken` | `ComputedRef`\<[`ClerkGetToken`](#clerkgettoken)\> | src/runtime/clerk/vue/index.ts:27 |
| <a id="orgid"></a> `orgId` | `ComputedRef`\<`string` \| `null` \| `undefined`\> | src/runtime/clerk/vue/index.ts:30 |
| <a id="orgrole"></a> `orgRole` | `ComputedRef`\<`string` \| `null` \| `undefined`\> | src/runtime/clerk/vue/index.ts:31 |
| <a id="sessionclaims"></a> `sessionClaims` | `ComputedRef`\< \| \{ `aud?`: `unknown`; \} \| `null` \| `undefined`\> | src/runtime/clerk/vue/index.ts:32 |

***

### ConvexProviderWithClerkOptions

Defined in: src/runtime/clerk/vue/index.ts:47

Options for [provideConvexAuthFromClerk](#provideconvexauthfromclerk) / `<ConvexProviderWithClerk>`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client?` | [`ConvexVueClient`](/api-reference/reference/vue#convexvueclient) | Convex client to authenticate. Defaults to the provided [useConvex](/api-reference/reference/vue#useconvex) client. | src/runtime/clerk/vue/index.ts:49 |
| <a id="useauth"></a> `useAuth?` | [`ClerkUseAuth`](#clerkuseauth) | Clerk's `useAuth` composable. Defaults to `useAuth` from `@clerk/vue`. | src/runtime/clerk/vue/index.ts:51 |

## Type Aliases

### ClerkGetToken

```ts
type ClerkGetToken = (options?) => Promise<string | null>;
```

Defined in: src/runtime/clerk/vue/index.ts:22

Minimal structural view of `@clerk/vue`'s `useAuth()` return — only the
fields the Convex adapter needs. Mirrors the hand-written `UseAuth` type in
`convex/react-clerk`, decoupling us from Clerk's full discriminated-union
type (which `useAuth` exposes as a per-field map of `ComputedRef`s).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | \{ `template?`: `string`; `skipCache?`: `boolean`; \} |
| `options.template?` | `string` |
| `options.skipCache?` | `boolean` |

#### Returns

`Promise`\<`string` \| `null`\>

***

### ClerkUseAuth

```ts
type ClerkUseAuth = () => ClerkAuthRefs;
```

Defined in: src/runtime/clerk/vue/index.ts:42

Portable type for `@clerk/vue`'s `useAuth` composable, narrowed to the fields
the Convex adapter reads. We don't reuse `typeof import('@clerk/vue').useAuth`
directly because its return type references Clerk-internal types that cannot
be named in our emitted declarations; the real composable is structurally
compatible and assigned through a cast.

#### Returns

[`ClerkAuthRefs`](#clerkauthrefs)

## Variables

### ConvexProviderWithClerk

```ts
const ConvexProviderWithClerk: DefineComponent<ExtractPropTypes<{
  client: {
     type: PropType<ConvexVueClient>;
     default: undefined;
  };
  useAuth: {
     type: PropType<ClerkUseAuth>;
     default: undefined;
  };
}>, () => VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[], {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  client: {
     type: PropType<ConvexVueClient>;
     default: undefined;
  };
  useAuth: {
     type: PropType<ClerkUseAuth>;
     default: undefined;
  };
}>, {
}>, {
  client: ConvexVueClient;
  useAuth: ClerkUseAuth;
}, SlotsType<{
  default: () => VNode<RendererNode, RendererElement, {
   [key: string]: any;
  }>[];
}>, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: src/runtime/clerk/vue/index.ts:122

Component form of [provideConvexAuthFromClerk](#provideconvexauthfromclerk) — a drop-in parity port
of `convex/react-clerk`'s `<ConvexProviderWithClerk>`. Renders its default
slot once Convex auth is wired.

## Functions

### provideConvexAuthFromClerk()

```ts
function provideConvexAuthFromClerk(options?): ConvexAuthState;
```

Defined in: src/runtime/clerk/vue/index.ts:105

Authenticate the Convex client with Clerk and expose the reactive auth state
to descendants via useConvexAuth.

Call this in a top-level component's `setup` (the app must be wrapped by a
configured Clerk plugin from `@clerk/vue`). Equivalent to wrapping with
`<ConvexProviderWithClerk>`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConvexProviderWithClerkOptions`](#convexproviderwithclerkoptions) |

#### Returns

[`ConvexAuthState`](/api-reference/reference/vue#convexauthstate)

#### Example

```vue
<script setup lang="ts">
import { provideConvexAuthFromClerk } from '@qruto/nuxt-convex/clerk/vue'
provideConvexAuthFromClerk()
</script>
```
