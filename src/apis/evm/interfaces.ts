/**
 * @packageDocumentation
 * @module EVM-Interfaces
 */

import { UTXOResponse } from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/evm";

export interface iEVMUTXOResponse extends UTXOResponse {
  utxos: UTXOSet
}