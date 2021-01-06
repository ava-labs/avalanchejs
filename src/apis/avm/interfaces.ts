/**
 * @packageDocumentation
 * @module AVM-Interfaces
 */

import { UTXOResponse } from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/avm";

export interface iUTXOID {
  txID:string
  outputIndex:number
}

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
