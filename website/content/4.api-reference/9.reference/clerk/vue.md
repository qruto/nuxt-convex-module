---
navigation: true
---

# clerk/vue

Vue login component for use with Clerk.

A Vue/Nuxt port of `convex/react-clerk`. The provider is exposed both as the
[provideConvexAuthFromClerk](#provideconvexauthfromclerk) composable and the thin
[ConvexProviderWithClerk](#convexproviderwithclerk) component wrapper; both adapt `@clerk/vue`'s
`useAuth()` into the generic Convex auth provider
([provideConvexAuth](/api-reference/reference/vue#provideconvexauth)) — no new auth core, just the SDK shim.

## Interfaces

### ConvexProviderWithClerkOptions

Defined in: src/runtime/clerk/vue/index.ts:43

Options for [provideConvexAuthFromClerk](#provideconvexauthfromclerk) / `<ConvexProviderWithClerk>`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client?` | [`IConvexVueClient`](/api-reference/reference/vue#iconvexvueclient) | Convex client to authenticate. Defaults to the provided useConvex client. | src/runtime/clerk/vue/index.ts:45 |
| <a id="useauth-1"></a> `useAuth?` | [`UseAuth`](#useauth) | Clerk's `useAuth` composable. Defaults to `useAuth` from `@clerk/vue`. | src/runtime/clerk/vue/index.ts:47 |

## Type Aliases

### UseAuth

```ts
type UseAuth = () => {
  isLoaded: ComputedRef<boolean>;
  isSignedIn: ComputedRef<boolean | undefined>;
  getToken: ComputedRef<(options) => Promise<string | null>>;
  orgId: ComputedRef<string | undefined | null>;
  orgRole: ComputedRef<string | undefined | null>;
  sessionClaims: ComputedRef<Record<string, unknown> | undefined | null>;
};
```

Defined in: src/runtime/clerk/vue/index.ts:24

#### Returns

```ts
{
  isLoaded: ComputedRef<boolean>;
  isSignedIn: ComputedRef<boolean | undefined>;
  getToken: ComputedRef<(options) => Promise<string | null>>;
  orgId: ComputedRef<string | undefined | null>;
  orgRole: ComputedRef<string | undefined | null>;
  sessionClaims: ComputedRef<Record<string, unknown> | undefined | null>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `isLoaded` | `ComputedRef`\<`boolean`\> | src/runtime/clerk/vue/index.ts:25 |
| `isSignedIn` | `ComputedRef`\<`boolean` \| `undefined`\> | src/runtime/clerk/vue/index.ts:26 |
| `getToken` | `ComputedRef`\<(`options`) => `Promise`\<`string` \| `null`\>\> | src/runtime/clerk/vue/index.ts:27 |
| `orgId` | `ComputedRef`\<`string` \| `undefined` \| `null`\> | src/runtime/clerk/vue/index.ts:32 |
| `orgRole` | `ComputedRef`\<`string` \| `undefined` \| `null`\> | src/runtime/clerk/vue/index.ts:33 |
| `sessionClaims` | `ComputedRef`\<`Record`\<`string`, `unknown`\> \| `undefined` \| `null`\> | src/runtime/clerk/vue/index.ts:37 |

## Variables

### ConvexProviderWithClerk

```ts
const ConvexProviderWithClerk: DefineComponent<ExtractPropTypes<{
  client: {
     type: PropType<IConvexVueClient>;
     default: undefined;
  };
  useAuth: {
     type: PropType<UseAuth>;
     default: undefined;
  };
}>, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[]
  | undefined, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  client: {
     type: PropType<IConvexVueClient>;
     default: undefined;
  };
  useAuth: {
     type: PropType<UseAuth>;
     default: undefined;
  };
}>, {
}>, {
  client: IConvexVueClient;
  useAuth: UseAuth;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: src/runtime/clerk/vue/index.ts:93

A wrapper Vue component which provides a ConvexVueClient
authenticated with Clerk — the component form of
[provideConvexAuthFromClerk](#provideconvexauthfromclerk), kept as a drop-in parity port of
`convex/react-clerk`'s `<ConvexProviderWithClerk>`. Renders its default
slot once Convex auth is wired.

## Functions

### provideConvexAuthFromClerk()

```ts
function provideConvexAuthFromClerk(options?): ConvexAuthState;
```

Defined in: src/runtime/clerk/vue/index.ts:74

A composable which provides a ConvexVueClient
authenticated with Clerk, exposing the reactive auth state to descendants
via useConvexAuth — the Vue translation of wrapping the app in
`convex/react-clerk`'s `<ConvexProviderWithClerk>`.

Call it in a top-level component's `setup`. The app must be wrapped by a
configured `clerkPlugin`, from `@clerk/vue`, `@clerk/nuxt` or
another Vue-based Clerk client library and have the corresponding
`useAuth` composable passed in (it defaults to `useAuth` from `@clerk/vue`).

See [Convex Clerk](https://docs.convex.dev/auth/clerk) on how to set up
Convex with Clerk.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConvexProviderWithClerkOptions`](#convexproviderwithclerkoptions) |

#### Returns

[`ConvexAuthState`](/api-reference/reference/vue#convexauthstate)

#### Example

```vue
<script setup lang="ts">
import { provideConvexAuthFromClerk } from 'nuxt-convex-module/clerk/vue'
provideConvexAuthFromClerk()
</script>
```
