---
navigation: true
---

# polar/vue/components

## Interfaces

### PolarComponentApi

Defined in: src/runtime/polar/vue/components.ts:31

The subset of the Polar component's action references these components need —
a Vue port mirror of `@convex-dev/polar`'s `PolarComponentApi`
(`Pick<…, 'generateCheckoutLink' | 'generateCustomerPortalUrl'>`). Supplied
via the auto-provided `api.billing` namespace, or passed through `:api`.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="generatecheckoutlink"></a> `generateCheckoutLink?` | [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"action"`, `"public"`, [`CheckoutArgs`](#checkoutargs), \{ `url`: `string`; \}\> | src/runtime/polar/vue/components.ts:32 |
| <a id="generatecustomerportalurl"></a> `generateCustomerPortalUrl?` | [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"action"`, `"public"`, \{ `returnUrl?`: `string`; \}, \{ `url`: `string`; \}\> | src/runtime/polar/vue/components.ts:33 |

## Type Aliases

### CheckoutArgs

```ts
type CheckoutArgs = {
  productIds: string[];
  origin: string;
  successUrl: string;
  subscriptionId?: string;
  metadata?: Record<string, string>;
  trialInterval?: "day" | "week" | "month" | "year" | null;
  trialIntervalCount?: number | null;
  locale?: string;
};
```

Defined in: src/runtime/polar/vue/components.ts:12

Args of the Polar-generated `generateCheckoutLink` action. Mirrors the
argument shape `@convex-dev/polar`'s component exposes.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="productids"></a> `productIds` | `string`[] | src/runtime/polar/vue/components.ts:13 |
| <a id="origin"></a> `origin` | `string` | src/runtime/polar/vue/components.ts:14 |
| <a id="successurl"></a> `successUrl` | `string` | src/runtime/polar/vue/components.ts:15 |
| <a id="subscriptionid"></a> `subscriptionId?` | `string` | src/runtime/polar/vue/components.ts:16 |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `string`\> | src/runtime/polar/vue/components.ts:17 |
| <a id="trialinterval"></a> `trialInterval?` | `"day"` \| `"week"` \| `"month"` \| `"year"` \| `null` | src/runtime/polar/vue/components.ts:18 |
| <a id="trialintervalcount"></a> `trialIntervalCount?` | `number` \| `null` | src/runtime/polar/vue/components.ts:19 |
| <a id="locale"></a> `locale?` | `string` | src/runtime/polar/vue/components.ts:20 |

## Variables

### CheckoutLink

```ts
const CheckoutLink: DefineComponent<ExtractPropTypes<{
  products: {
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
     type: PropType<TrialInterval>;
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
     type: PropType<CheckoutTheme>;
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
  api: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
}>, () => VNode<RendererNode, RendererElement, {
[key: string]: any;
}>, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  products: {
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
     type: PropType<TrialInterval>;
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
     type: PropType<CheckoutTheme>;
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
  api: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
}>, {
}>, {
  subscriptionId: string;
  metadata: Record<string, string>;
  trialInterval: TrialInterval;
  trialIntervalCount: number | null;
  locale: string;
  theme: CheckoutTheme;
  embed: boolean;
  lazy: boolean;
  api: PolarComponentApi;
}, SlotsType<{
  default: () => VNode<RendererNode, RendererElement, {
   [key: string]: any;
  }>[];
}>, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: src/runtime/polar/vue/components.ts:54

Renders a Polar checkout link — embedded modal (default) or redirect — with
optional lazy generation and trial configuration. A Vue port of
`@convex-dev/polar/react`'s `CheckoutLink`.

The `generateCheckoutLink` action comes from the auto-provided `api.billing`
namespace; pass `:api` to override.

#### Example

```vue
<CheckoutLink :products="[productId]" :trial-interval-count="7" trial-interval="day">
  Start free trial
</CheckoutLink>
```

***

### CustomerPortalLink

```ts
const CustomerPortalLink: DefineComponent<ExtractPropTypes<{
  returnUrl: {
     type: StringConstructor;
     default: undefined;
  };
  api: {
     type: PropType<PolarComponentApi>;
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
  returnUrl: {
     type: StringConstructor;
     default: undefined;
  };
  api: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
}>, {
}>, {
  returnUrl: string;
  api: PolarComponentApi;
}, SlotsType<{
  default: () => VNode<RendererNode, RendererElement, {
   [key: string]: any;
  }>[];
}>, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: src/runtime/polar/vue/components.ts:142

Renders a link to the Polar customer portal (subscription management). A Vue
port of `@convex-dev/polar/react`'s `CustomerPortalLink` — renders nothing
until the portal URL resolves. Uses the auto-provided `api.billing` namespace;
pass `:api` to override.
