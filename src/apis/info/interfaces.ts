/**
 * @packageDocumentation
 * @module Info-Interfaces
 */

import BN from "bn.js"

export interface GetBlockchainIDParams {
  alias: string
}

export interface IsBootstrappedParams {
  chain: string
}

export interface PeersParams {
  nodeIDs: string[]
}

export interface PeersResponse {
  ip: string
  publicIP: string
  nodeID: string
  version: string
  lastSent: string
  lastReceived: string
}

export interface GetTxFeeResponse {
  txFee: BN
  creationTxFee: BN
}

export interface UptimeResponse {
  rewardingStakePercentage: string
  weightedAveragePercentage: string
}
