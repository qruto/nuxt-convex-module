---
navigation: false
description: "Vue login component for use with Auth0 — generated TypeScript API reference for nuxt-convex-module/auth0/client."
seo:
  title: "API reference: auth0/client"
---

# auth0/client

Vue login component for use with Auth0.

A Vue/Nuxt port of `convex/react-auth0`. The provider is exposed both as the
[provideConvexWithAuth0](#provideconvexwithauth0) composable and the thin
[ConvexProviderWithAuth0](#convexproviderwithauth0) component wrapper; both adapt
`@auth0/auth0-vue`'s `useAuth0()` into the generic Convex auth provider
([provideConvexWithAuth](/api-reference/reference/client#provideconvexwithauth)) — no new auth core, just the SDK shim.

## Interfaces

### ConvexProviderWithAuth0Options

Defined in: [src/runtime/auth0/vue/index.ts:23](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/auth0/vue/index.ts#L23)

Options for [provideConvexWithAuth0](#provideconvexwithauth0) / `<ConvexProviderWithAuth0>`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client?` | [`IConvexVueClient`](/api-reference/reference/client#iconvexvueclient) | Convex client to authenticate. Defaults to the client `useConvex()` returns. | [src/runtime/auth0/vue/index.ts:25](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/auth0/vue/index.ts#L25) |

## Variables

### ~~provideConvexAuthFromAuth0~~

```ts
const provideConvexAuthFromAuth0: (options) => ConvexAuthState = provideConvexWithAuth0;
```

Defined in: [src/runtime/auth0/vue/index.ts:61](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/auth0/vue/index.ts#L61)

The old name of [provideConvexWithAuth0](#provideconvexwithauth0).

The composable form of [ConvexProviderWithAuth0](#convexproviderwithauth0) — provides a
[ConvexVueClient](/api-reference/reference/client#convexvueclient) authenticated with Auth0.

It must be called in an app wrapped by a configured Auth0 plugin from
`@auth0/auth0-vue`.

See [Convex Auth0](https://docs.convex.dev/auth/auth0) on how to set up
Convex with Auth0.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`ConvexProviderWithAuth0Options`](#convexproviderwithauth0options) |

#### Returns

[`ConvexAuthState`](/api-reference/reference/client#convexauthstate)

#### Example

```vue
<script setup lang="ts">
import { provideConvexWithAuth0 } from 'nuxt-convex-module/auth0/client'
provideConvexWithAuth0()
</script>
```

#### Deprecated

Use `provideConvexWithAuth0`. Removed in the next minor release.

***

### ConvexProviderWithAuth0

```ts
const ConvexProviderWithAuth0: DefineComponent<ExtractPropTypes<{
  client: {
     type: PropType<IConvexVueClient>;
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
}>, {
}>, {
  client: IConvexVueClient;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/auth0/vue/index.ts:76](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/auth0/vue/index.ts#L76)

A wrapper Vue component which provides a [ConvexVueClient](/api-reference/reference/client#convexvueclient)
authenticated with Auth0 — the component form of
[provideConvexWithAuth0](#provideconvexwithauth0). Renders its default slot once Convex
auth is wired.

It must be wrapped by a configured Auth0 plugin from `@auth0/auth0-vue`.

See [Convex Auth0](https://docs.convex.dev/auth/auth0) on how to set up
Convex with Auth0.

## Functions

### provideConvexWithAuth0()

```ts
function provideConvexWithAuth0(options?): ConvexAuthState;
```

Defined in: [src/runtime/auth0/vue/index.ts:48](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/auth0/vue/index.ts#L48)

The composable form of [ConvexProviderWithAuth0](#convexproviderwithauth0) — provides a
[ConvexVueClient](/api-reference/reference/client#convexvueclient) authenticated with Auth0.

It must be called in an app wrapped by a configured Auth0 plugin from
`@auth0/auth0-vue`.

See [Convex Auth0](https://docs.convex.dev/auth/auth0) on how to set up
Convex with Auth0.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`ConvexProviderWithAuth0Options`](#convexproviderwithauth0options) |

#### Returns

[`ConvexAuthState`](/api-reference/reference/client#convexauthstate)

#### Example

```vue
<script setup lang="ts">
import { provideConvexWithAuth0 } from 'nuxt-convex-module/auth0/client'
provideConvexWithAuth0()
</script>
```
