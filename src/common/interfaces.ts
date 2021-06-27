/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from 'buffer/';
import BN from 'bn.js';
import { TransferableOutput } from '../apis/platformvm';
import { SerializedEncoding } from 'src/utils'

export interface Index {
  address: string
  utxo: string
}

export interface UTXOResponse {
  numFetched: number
  utxos: any
  endIndex: Index
}

export interface Asset {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}

export interface StakedOuts {
  nodeID: string
  stakedUntil: string
  stakeOnlyUntil: string
  owners: string[]
  threshold: string
  amount: string
}

export interface GetStakeParams {
  addresses: string[]
  encoding: string
}

export interface GetStakeResponse {
  staked: BN
  stakedOutputs: TransferableOutput[]
}
export interface BaseIndexParams {
  encoding: string
}

export interface BaseIndexResponse {
  id: string
  bytes: string
  timestamp: string
  encoding: string
  index: string
}

export interface GetLastAcceptedParams extends BaseIndexParams { }

export interface GetLastAcceptedResponse extends BaseIndexResponse { }

export interface GetContainerByIndexParams extends BaseIndexParams {
  index: string
}

export interface GetContainerByIndexResponse extends BaseIndexResponse { }

export interface GetContainerByIDParams extends BaseIndexParams {
  containerID: string
}

export interface GetContainerByIDResponse extends BaseIndexResponse { }

export interface GetContainerRangeParams extends BaseIndexParams {
  startIndex: number,
  numToFetch: number
}

export interface GetContainerRangeResponse extends BaseIndexResponse { }

export interface GetIndexParams extends BaseIndexParams {
  containerID: string
}

export interface GetIsAcceptedParams extends BaseIndexParams {
  containerID: string
}

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

export interface GetRewardUTXOsParams {
  txID: string
  encoding: string
}

export interface GetRewardUTXOsResponse {
  numFetched: number
  utxos: string[]
  encoding: string
}

export interface WordLists {
  czech: string[]
  chinese_simplified: string[]
  chinese_traditional: string[]
  korean: string[]
  french: string[]
  italian: string[]
  spanish: string[]
  japanese: string[]
  JA: string[]
  portuguese: string[]
  english: string[]
  EN: string[]
}
export interface GetAtomicTxStatusParams {
  txID: string
}

export interface Serialized {
  vm: string
  encoding: SerializedEncoding
  version: number
  notes: string
  fields: object
}