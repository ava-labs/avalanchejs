/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from 'buffer/';

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
export interface Payload {
  result: {
    name: string,
    symbol: string,
    assetID: string,
    denomination: number
  }
}