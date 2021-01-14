/**
 * @packageDocumentation
 * @module AVM-Interfaces
 */

import { 
  iUTXOID, 
  iUTXOResponse 
} from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/avm";
export interface iGetBalanceResponse {
  balance:string
  utxoIDs:iUTXOID[] 
}

export interface iGetBalanceParams {
  address:string
  assetID:string
}

export interface iAVMUTXOResponse extends iUTXOResponse {
  utxos: UTXOSet
}

export interface iGetTxStatusParams {
  txID: string
}

export interface iGetTxStatusResponse {
  status: string
  epoch?: number
}