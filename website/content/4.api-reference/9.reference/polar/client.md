---
navigation: true
---

# polar/client

Vue ports of `@convex-dev/polar/react`'s billing components —
[CheckoutLink](#checkoutlink) and [CustomerPortalLink](#customerportallink).

## Interfaces

### PolarComponentApi

Defined in: [src/runtime/polar/vue/components.ts:44](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L44)

The subset of the Polar component's action references these components need —
a Vue port mirror of `@convex-dev/polar`'s `PolarComponentApi`
(`Pick<…, 'generateCheckoutLink' | 'generateCustomerPortalUrl'>`). Supplied
via the auto-provided `api.billing` namespace, or passed through `:polar-api`.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="generatecheckoutlink"></a> `generateCheckoutLink?` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"action"`, `"public"`, [`CheckoutArgs`](#checkoutargs), \{ `url`: `string`; \}\> | [src/runtime/polar/vue/components.ts:45](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L45) |
| <a id="generatecustomerportalurl"></a> `generateCustomerPortalUrl?` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"action"`, `"public"`, \{ `returnUrl?`: `string`; \}, \{ `url`: `string`; \}\> | [src/runtime/polar/vue/components.ts:46](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L46) |

## Type Aliases

### CheckoutArgs

```ts
type CheckoutArgs = {
  productIds: string[];
  origin: string;
  successUrl: string;
  subscriptionId?: string;
  metadata?: Record<string, string>;
  trialInterval?: string | null;
  trialIntervalCount?: number | null;
  locale?: string;
};
```

Defined in: [src/runtime/polar/vue/components.ts:18](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L18)

Args of the Polar-generated `generateCheckoutLink` action. Mirrors the
argument shape `@convex-dev/polar`'s component exposes.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="productids"></a> `productIds` | `string`[] | - | [src/runtime/polar/vue/components.ts:19](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L19) |
| <a id="origin"></a> `origin` | `string` | - | [src/runtime/polar/vue/components.ts:20](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L20) |
| <a id="successurl"></a> `successUrl` | `string` | - | [src/runtime/polar/vue/components.ts:21](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L21) |
| <a id="subscriptionid"></a> `subscriptionId?` | `string` | - | [src/runtime/polar/vue/components.ts:22](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L22) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `string`\> | - | [src/runtime/polar/vue/components.ts:23](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L23) |
| <a id="trialinterval"></a> `trialInterval?` | `string` \| `null` | `string | null` — not the literal-day/week/month/year union — because upstream's action arg is validator-derived (`v.union(v.string(), v.null())`), so the user's `_generated/api` reference types it that way; a narrower type here would reject their `:polar-api` binding. The component *prop* keeps the literal union, matching upstream's React prop declaration. | [src/runtime/polar/vue/components.ts:31](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L31) |
| <a id="trialintervalcount"></a> `trialIntervalCount?` | `number` \| `null` | - | [src/runtime/polar/vue/components.ts:32](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L32) |
| <a id="locale"></a> `locale?` | `string` | - | [src/runtime/polar/vue/components.ts:33](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L33) |

## Variables

### CustomerPortalLink

```ts
const CustomerPortalLink: DefineComponent<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  returnUrl: {
     type: StringConstructor;
     default: undefined;
  };
}>, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>
  | null, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  returnUrl: {
     type: StringConstructor;
     default: undefined;
  };
}>, {
}>, {
  polarApi: PolarComponentApi;
  returnUrl: string;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/polar/vue/components.ts:55](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L55)

#### Example

```vue
<CustomerPortalLink>Manage subscription</CustomerPortalLink>
```

***

### CheckoutLink

```ts
const CheckoutLink: DefineComponent<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  productIds: {
     type: PropType<string[]>;
     required: true;
  };
  subscriptionId: {
     type: StringConstructor;
     default: undefined;
  };
  metadata: {
     type: PropType<Record<string, string>>;
     default: undefined;
  };
  trialInterval: {
     type: PropType<"day" | "week" | "month" | "year" | null>;
     default: undefined;
  };
  trialIntervalCount: {
     type: PropType<number | null>;
     default: undefined;
  };
  locale: {
     type: StringConstructor;
     default: undefined;
  };
  theme: {
     type: PropType<"dark" | "light">;
     default: string;
  };
  embed: {
     type: BooleanConstructor;
     default: boolean;
  };
  lazy: {
     type: BooleanConstructor;
     default: boolean;
  };
}>, () => VNode<RendererNode, RendererElement, {
[key: string]: any;
}>, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  productIds: {
     type: PropType<string[]>;
     required: true;
  };
  subscriptionId: {
     type: StringConstructor;
     default: undefined;
  };
  metadata: {
     type: PropType<Record<string, string>>;
     default: undefined;
  };
  trialInterval: {
     type: PropType<"day" | "week" | "month" | "year" | null>;
     default: undefined;
  };
  trialIntervalCount: {
     type: PropType<number | null>;
     default: undefined;
  };
  locale: {
     type: StringConstructor;
     default: undefined;
  };
  theme: {
     type: PropType<"dark" | "light">;
     default: string;
  };
  embed: {
     type: BooleanConstructor;
     default: boolean;
  };
  lazy: {
     type: BooleanConstructor;
     default: boolean;
  };
}>, {
}>, {
  polarApi: PolarComponentApi;
  subscriptionId: string;
  metadata: Record<string, string>;
  trialInterval: "day" | "week" | "month" | "year" | null;
  trialIntervalCount: number | null;
  locale: string;
  theme: "dark" | "light";
  embed: boolean;
  lazy: boolean;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/polar/vue/components.ts:106](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/polar/vue/components.ts#L106)

Renders a checkout link. Supports embedded or redirect checkout, with optional lazy loading and trial configuration.

#### Example

```vue
<CheckoutLink :product-ids="[productId]" :trial-interval-count="7" trial-interval="day">
  Start free trial
</CheckoutLink>
```
