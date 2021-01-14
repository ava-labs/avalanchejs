/**
 * @packageDocumentation
 * @module Info-Interfaces
 */

import BN from "bn.js";

export interface iGetBlockchainIDParams {
  alias: string
}

export interface iGetTxFeeResponse {
  txFee: BN 
  creationTxFee:  BN
}

export interface iIsBootstrappedParams {
  chain: string
}