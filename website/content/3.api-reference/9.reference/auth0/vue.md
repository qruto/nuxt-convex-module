---
navigation: true
---

# auth0/vue

Convex + Auth0 integration for Vue.

A Vue/Nuxt port of `convex/react-auth0`'s `ConvexProviderWithAuth0`. It adapts
`@auth0/auth0-vue`'s `useAuth0()` into the generic Convex auth provider
([provideConvexAuth](/api-reference/reference/vue#provideconvexauth)) — no new auth core, just the SDK shim.

## Interfaces

### ConvexProviderWithAuth0Options

Defined in: src/runtime/auth0/vue/index.ts:19

Options for [provideConvexAuthFromAuth0](#provideconvexauthfromauth0) / `<ConvexProviderWithAuth0>`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client?` | [`ConvexVueClient`](/api-reference/reference/vue#convexvueclient) | Convex client to authenticate. Defaults to the provided [useConvex](/api-reference/reference/vue#useconvex) client. | src/runtime/auth0/vue/index.ts:21 |

## Variables

### ConvexProviderWithAuth0

```ts
const ConvexProviderWithAuth0: DefineComponent<ExtractPropTypes<{
  client: {
     type: PropType<ConvexVueClient>;
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
}>, {
}>, {
  client: ConvexVueClient;
}, SlotsType<{
  default: () => VNode<RendererNode, RendererElement, {
   [key: string]: any;
  }>[];
}>, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: src/runtime/auth0/vue/index.ts:87

Component form of [provideConvexAuthFromAuth0](#provideconvexauthfromauth0) — a drop-in parity port
of `convex/react-auth0`'s `<ConvexProviderWithAuth0>`. Renders its default
slot once Convex auth is wired.

## Functions

### provideConvexAuthFromAuth0()

```ts
function provideConvexAuthFromAuth0(options?): ConvexAuthState;
```

Defined in: src/runtime/auth0/vue/index.ts:73

Authenticate the Convex client with Auth0 and expose the reactive auth state
to descendants via useConvexAuth.

Call this in a top-level component's `setup` (the app must be wrapped by a
configured Auth0 plugin from `@auth0/auth0-vue`). Equivalent to wrapping with
`<ConvexProviderWithAuth0>`.

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
