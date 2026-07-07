---
navigation: true
---

# auth0/vue

Vue login component for use with Auth0.

A Vue/Nuxt port of `convex/react-auth0`. The provider is exposed both as the
[provideConvexAuthFromAuth0](#provideconvexauthfromauth0) composable and the thin
[ConvexProviderWithAuth0](#convexproviderwithauth0) component wrapper; both adapt
`@auth0/auth0-vue`'s `useAuth0()` into the generic Convex auth provider
([provideConvexAuth](/api-reference/reference/vue#provideconvexauth)) — no new auth core, just the SDK shim.

## Interfaces

### ConvexProviderWithAuth0Options

Defined in: src/runtime/auth0/vue/index.ts:23

Options for [provideConvexAuthFromAuth0](#provideconvexauthfromauth0) / `<ConvexProviderWithAuth0>`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client?` | [`IConvexVueClient`](/api-reference/reference/vue#iconvexvueclient) | Convex client to authenticate. Defaults to the provided useConvex client. | src/runtime/auth0/vue/index.ts:25 |

## Variables

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

Defined in: src/runtime/auth0/vue/index.ts:68

A wrapper Vue component which provides a ConvexVueClient
authenticated with Auth0 — the component form of
[provideConvexAuthFromAuth0](#provideconvexauthfromauth0). Renders its default slot once Convex
auth is wired.

It must be wrapped by a configured Auth0 plugin from `@auth0/auth0-vue`.

See [Convex Auth0](https://docs.convex.dev/auth/auth0) on how to set up
Convex with Auth0.

## Functions

### provideConvexAuthFromAuth0()

```ts
function provideConvexAuthFromAuth0(options?): ConvexAuthState;
```

Defined in: src/runtime/auth0/vue/index.ts:48

The composable form of [ConvexProviderWithAuth0](#convexproviderwithauth0) — provides a
ConvexVueClient authenticated with Auth0.

It must be called in an app wrapped by a configured Auth0 plugin from
`@auth0/auth0-vue`.

See [Convex Auth0](https://docs.convex.dev/auth/auth0) on how to set up
Convex with Auth0.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConvexProviderWithAuth0Options`](#convexproviderwithauth0options) |

#### Returns

[`ConvexAuthState`](/api-reference/reference/vue#convexauthstate)

#### Example

```vue
<script setup lang="ts">
import { provideConvexAuthFromAuth0 } from '@qruto/nuxt-convex/auth0/vue'
provideConvexAuthFromAuth0()
</script>
```
