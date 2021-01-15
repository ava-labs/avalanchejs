/**
 * @packageDocumentation
 * @module EVM-Interfaces
 */

import { iIndex, iUTXOResponse } from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/evm";

export interface iEVMUTXOResponse extends iUTXOResponse {
  utxos: UTXOSet
}

export interface iGetUTXOsParams {
  addresses: string[] | string
  limit: number
  sourceChain?: string
  startIndex?: iIndex
}