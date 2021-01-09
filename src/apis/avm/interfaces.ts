/**
 * @packageDocumentation
 * @module AVM-Interfaces
 */

import { iUTXOID, UTXOResponse } from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/avm";
export interface iGetBalanceResponse {
  balance:string
  utxoIDs:iUTXOID[] 
}

export interface iGetBalanceParams {
  address:string
  assetID:string
}

export interface iAVMUTXOResponse extends UTXOResponse {
  utxos: UTXOSet
}
