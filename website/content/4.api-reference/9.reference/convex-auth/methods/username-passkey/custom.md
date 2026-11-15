---
navigation: false
description: "The passkey composables on ceremonies that the app provides, for example on a native passkey library: a port of…"
seo:
  title: "API reference: convex-auth/methods/username-passkey/custom"
---

# convex-auth/methods/username-passkey/custom

The passkey composables on ceremonies that the app provides, for example
on a native passkey library: a port of
`@convex-dev/auth/methods/username-passkey/react-custom`.

## Type Aliases

### PasskeyRegistrationResponse

```ts
type PasskeyRegistrationResponse = {
  id: string;
  rawId: string;
  response: {
     clientDataJSON: string;
     attestationObject: string;
     transports?: string[] | null;
  };
  type: "public-key";
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:137](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L137)

A registration response in the WebAuthn JSON encoding, as the passkey
libraries return it.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:138](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L138) |
| <a id="rawid"></a> `rawId` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:139](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L139) |
| <a id="response"></a> `response` | \{ `clientDataJSON`: `string`; `attestationObject`: `string`; `transports?`: `string`[] \| `null`; \} | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:140](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L140) |
| `response.clientDataJSON` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:141](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L141) |
| `response.attestationObject` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:142](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L142) |
| `response.transports?` | `string`[] \| `null` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:143](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L143) |
| <a id="type"></a> `type` | `"public-key"` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:145](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L145) |

***

### PasskeyAuthenticationResponse

```ts
type PasskeyAuthenticationResponse = {
  id: string;
  rawId: string;
  response: {
     clientDataJSON: string;
     authenticatorData: string;
     signature: string;
     userHandle?: string | null;
  };
  type: "public-key";
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:150](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L150)

An authentication response in the WebAuthn JSON encoding, as the passkey
libraries return it.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-1"></a> `id` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:151](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L151) |
| <a id="rawid-1"></a> `rawId` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:152](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L152) |
| <a id="response-1"></a> `response` | \{ `clientDataJSON`: `string`; `authenticatorData`: `string`; `signature`: `string`; `userHandle?`: `string` \| `null`; \} | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:153](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L153) |
| `response.clientDataJSON` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:154](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L154) |
| `response.authenticatorData` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:155](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L155) |
| `response.signature` | `string` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:156](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L156) |
| `response.userHandle?` | `string` \| `null` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:157](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L157) |
| <a id="type-1"></a> `type` | `"public-key"` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:159](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L159) |

***

### PasskeyCeremonies

```ts
type PasskeyCeremonies = {
  isSupported: () => boolean;
  register: (options) => Promise<
     | {
     success: true;
     response: PasskeyRegistrationResponse;
   }
    | PasskeyClientFailure>;
  authenticate: (options) => Promise<
     | {
     success: true;
     response: PasskeyAuthenticationResponse;
   }
    | PasskeyClientFailure>;
  autofill?: {
     isAvailable: () => Promise<boolean>;
     authenticate: (options, signal) => Promise<
        | {
        success: true;
        response: PasskeyAuthenticationResponse;
      }
       | PasskeyClientFailure>;
     onResume?: (listener) => () => void;
  };
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:221](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L221)

The passkey ceremonies of a platform, which an app implements to run the
passkey hooks outside a browser. `createUsernamePasskeyHooks` takes one.

`register` and `authenticate` return the response of the platform as it is:
the hooks keep only the fields the server accepts. For a failure they
recognize, they return the matching [PasskeyClientError](/api-reference/reference/convex-auth/methods/username-passkey#passkeyclienterror). A thrown
error named `NotAllowedError` or `AbortError` becomes `CEREMONY_ABORTED`,
and any other thrown value becomes `OTHER_ERROR`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="issupported"></a> `isSupported` | () => `boolean` | Whether this device can run passkey ceremonies. | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:223](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L223) |
| <a id="register"></a> `register` | (`options`) => `Promise`\< \| \{ `success`: `true`; `response`: [`PasskeyRegistrationResponse`](#passkeyregistrationresponse); \} \| [`PasskeyClientFailure`](/api-reference/reference/convex-auth/methods/username-passkey#passkeyclientfailure)\> | - | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:224](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L224) |
| <a id="authenticate"></a> `authenticate` | (`options`) => `Promise`\< \| \{ `success`: `true`; `response`: [`PasskeyAuthenticationResponse`](#passkeyauthenticationresponse); \} \| [`PasskeyClientFailure`](/api-reference/reference/convex-auth/methods/username-passkey#passkeyclientfailure)\> | - | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:230](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L230) |
| <a id="autofill"></a> `autofill?` | \{ `isAvailable`: () => `Promise`\<`boolean`\>; `authenticate`: (`options`, `signal`) => `Promise`\< \| \{ `success`: `true`; `response`: [`PasskeyAuthenticationResponse`](#passkeyauthenticationresponse); \} \| [`PasskeyClientFailure`](/api-reference/reference/convex-auth/methods/username-passkey#passkeyclientfailure)\>; `onResume?`: (`listener`) => () => `void`; \} | Passkey autofill. Without it, autofill reports `available: false`. | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:237](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L237) |
| `autofill.isAvailable` | () => `Promise`\<`boolean`\> | - | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:238](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L238) |
| `autofill.authenticate` | (`options`, `signal`) => `Promise`\< \| \{ `success`: `true`; `response`: [`PasskeyAuthenticationResponse`](#passkeyauthenticationresponse); \} \| [`PasskeyClientFailure`](/api-reference/reference/convex-auth/methods/username-passkey#passkeyclientfailure)\> | - | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:239](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L239) |
| `autofill.onResume?` | (`listener`) => () => `void` | - | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:246](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L246) |

## Functions

### createUsernamePasskeyHooks()

```ts
function createUsernamePasskeyHooks(ceremonies): {
  useSignInWithUsernamePasskey: (api) => {
     signIn: (args) => Promise<SignInWithUsernamePasskeyResult>;
     pending: ComputedRef<boolean>;
     autofill: {
        available: Ref<boolean | null>;
        status: Ref<PasskeyAutofillStatus>;
        lastError: ShallowRef<
           | UsernamePasskeyAutofillError
          | null>;
     };
  };
  useAddPasskey: (api) => {
     addPasskey: () => Promise<AddPasskeyResult>;
     pending: Ref<boolean>;
  };
  useRemovePasskey: (api) => {
     removePasskey: (passkeyId) => Promise<RemovePasskeyResult>;
     pending: Ref<boolean>;
  };
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/custom.ts:60](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/custom.ts#L60)

Make the passkey composables on the given ceremonies. They take the same
arguments and return the same results as the composables of
`nuxt-convex-module/convex-auth/methods/username-passkey`.

Call it once, at the top level of a module:

```ts
export const { useSignInWithUsernamePasskey, useAddPasskey, useRemovePasskey }
  = createUsernamePasskeyHooks(ceremonies)
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ceremonies` | [`PasskeyCeremonies`](#passkeyceremonies) |

#### Returns

```ts
{
  useSignInWithUsernamePasskey: (api) => {
     signIn: (args) => Promise<SignInWithUsernamePasskeyResult>;
     pending: ComputedRef<boolean>;
     autofill: {
        available: Ref<boolean | null>;
        status: Ref<PasskeyAutofillStatus>;
        lastError: ShallowRef<
           | UsernamePasskeyAutofillError
          | null>;
     };
  };
  useAddPasskey: (api) => {
     addPasskey: () => Promise<AddPasskeyResult>;
     pending: Ref<boolean>;
  };
  useRemovePasskey: (api) => {
     removePasskey: (passkeyId) => Promise<RemovePasskeyResult>;
     pending: Ref<boolean>;
  };
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `useSignInWithUsernamePasskey()` | (`api`) => \{ `signIn`: (`args`) => `Promise`\<[`SignInWithUsernamePasskeyResult`](/api-reference/reference/convex-auth/methods/username-passkey#signinwithusernamepasskeyresult)\>; `pending`: `ComputedRef`\<`boolean`\>; `autofill`: \{ `available`: `Ref`\<`boolean` \| `null`\>; `status`: `Ref`\<[`PasskeyAutofillStatus`](/api-reference/reference/convex-auth/methods/username-passkey#passkeyautofillstatus)\>; `lastError`: `ShallowRef`\< \| [`UsernamePasskeyAutofillError`](/api-reference/reference/convex-auth/methods/username-passkey#usernamepasskeyautofillerror) \| `null`\>; \}; \} | [src/runtime/convex-auth/vue/methods/username-passkey/custom.ts:63](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/custom.ts#L63) |
| `useAddPasskey()` | (`api`) => \{ `addPasskey`: () => `Promise`\<[`AddPasskeyResult`](/api-reference/reference/convex-auth/methods/username-passkey#addpasskeyresult)\>; `pending`: `Ref`\<`boolean`\>; \} | [src/runtime/convex-auth/vue/methods/username-passkey/custom.ts:65](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/custom.ts#L65) |
| `useRemovePasskey()` | (`api`) => \{ `removePasskey`: (`passkeyId`) => `Promise`\<[`RemovePasskeyResult`](/api-reference/reference/convex-auth/methods/username-passkey#removepasskeyresult)\>; `pending`: `Ref`\<`boolean`\>; \} | [src/runtime/convex-auth/vue/methods/username-passkey/custom.ts:66](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/custom.ts#L66) |

## References

### SignInWithUsernamePasskeyResult

Re-exports [SignInWithUsernamePasskeyResult](/api-reference/reference/convex-auth/methods/username-passkey#signinwithusernamepasskeyresult)

***

### RenamePasskeyResult

Re-exports [RenamePasskeyResult](/api-reference/reference/convex-auth/methods/username-passkey#renamepasskeyresult)

***

### AddPasskeyApi

Re-exports [AddPasskeyApi](/api-reference/reference/convex-auth/methods/username-passkey#addpasskeyapi)

***

### AddPasskeyResult

Re-exports [AddPasskeyResult](/api-reference/reference/convex-auth/methods/username-passkey#addpasskeyresult)

***

### RemovePasskeyApi

Re-exports [RemovePasskeyApi](/api-reference/reference/convex-auth/methods/username-passkey#removepasskeyapi)

***

### RemovePasskeyResult

Re-exports [RemovePasskeyResult](/api-reference/reference/convex-auth/methods/username-passkey#removepasskeyresult)

***

### PasskeyClientError

Re-exports [PasskeyClientError](/api-reference/reference/convex-auth/methods/username-passkey#passkeyclienterror)

***

### PasskeyClientFailure

Re-exports [PasskeyClientFailure](/api-reference/reference/convex-auth/methods/username-passkey#passkeyclientfailure)

***

### WireCreationOptions

Re-exports [WireCreationOptions](/api-reference/reference/convex-auth/methods/username-passkey#wirecreationoptions)

***

### WireRequestOptions

Re-exports [WireRequestOptions](/api-reference/reference/convex-auth/methods/username-passkey#wirerequestoptions)

***

### UsernamePasskeyApi

Re-exports [UsernamePasskeyApi](/api-reference/reference/convex-auth/methods/username-passkey#usernamepasskeyapi)

***

### UsernamePasskeyAutofillError

Re-exports [UsernamePasskeyAutofillError](/api-reference/reference/convex-auth/methods/username-passkey#usernamepasskeyautofillerror)

***

### AlreadyPendingFailure

Re-exports [AlreadyPendingFailure](/api-reference/reference/convex-auth/methods/username-passkey#alreadypendingfailure)

***

### PasskeyAutofillStatus

Re-exports [PasskeyAutofillStatus](/api-reference/reference/convex-auth/methods/username-passkey#passkeyautofillstatus)
