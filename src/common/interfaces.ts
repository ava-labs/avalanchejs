/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from 'buffer/';
import { BN } from 'src'

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
}

export interface GetStakeResponse {
  staked: BN
  stakedOuts: null | StakedOuts[]
}