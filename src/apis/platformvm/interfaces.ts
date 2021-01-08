/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */

import { UTXOResponse } from "./../../common/interfaces";
import { UTXOSet } from "./../../apis/platformvm";

export interface iPlatformVMUTXOResponse extends UTXOResponse {
  utxos: UTXOSet
}