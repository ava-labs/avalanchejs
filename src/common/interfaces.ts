/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from "buffer/"
import { SerializedEncoding } from "../utils"

export interface CredsInterface {
  username: string
  password: string
}

export interface IssueTxParams {
  tx: string
  encoding: string
}

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

export interface Serialized {
  vm: string
  encoding: SerializedEncoding
  version: number
  notes: string
  fields: object
}
