/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from "buffer/";

export interface iIndex {
  address: string
  utxo: string
}

export interface iUTXOResponse {
  numFetched: number
  encoding: string
  endIndex: iIndex
}

export interface iUTXOID {
  txID:string
  outputIndex:number
}

export interface iAsset {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}
export interface iPayload {
  result: {
    name: string
    symbol: string
    assetID: string
    denomination: number
  }
}

export interface iRPC {
  id?: number
  method?: string
  params?: object[] | object
  jsonrpc?: string
}