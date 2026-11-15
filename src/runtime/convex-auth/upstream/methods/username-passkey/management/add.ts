// Not a copy. See `../../../browser/ambientSignInClient.ts`.
import type { PasskeyFunctionResult } from '../server'

export type StartAddPasskeyResult = PasskeyFunctionResult<'startAddPasskey'>
export type VerifyAddPasskeyResult = PasskeyFunctionResult<'verifyAddPasskey'>
export type FinishAddPasskeyResult = PasskeyFunctionResult<'finishAddPasskey'>
