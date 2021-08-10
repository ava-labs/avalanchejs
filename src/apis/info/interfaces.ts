/**
 * @packageDocumentation
 * @module Info-Interfaces
 */

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
