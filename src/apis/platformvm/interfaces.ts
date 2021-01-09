/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */

import { iUTXOID, UTXOResponse } from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/platformvm";

export interface iPlatformVMUTXOResponse extends UTXOResponse {
  utxos: UTXOSet
}

export interface iGetBalanceResponse {
  balance:string
  unlocked: string
  lockedStakeable: string
  lockedNotStakeable: string
  utxoIDs:iUTXOID[] 
}

export interface iGetBalanceParams {
  address:string
}
