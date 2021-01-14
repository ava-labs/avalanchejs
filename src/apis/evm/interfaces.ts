/**
 * @packageDocumentation
 * @module EVM-Interfaces
 */

import { iUTXOResponse } from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/evm";

export interface iEVMUTXOResponse extends iUTXOResponse {
  utxos: UTXOSet
}