/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from 'buffer/';
import { UTXOSet as AVMUTXOSet } from 'src/apis/avm';
import { UTXOSet as EVMUTXOSet } from 'src/apis/evm';
import { UTXOSet as PlatformVMUTXOSet } from 'src/apis/platformvm';

export interface iIndex {
  address: string
  utxo: string
}

export interface iUTXOResponse {
  numFetched: number
  encoding: string
  endIndex: iIndex
}

export interface iAVMUTXOResponse extends iUTXOResponse {
  utxos: AVMUTXOSet
}

export interface iPlatformVMUTXOResponse extends iUTXOResponse {
  utxos: PlatformVMUTXOSet
}

export interface iEVMUTXOResponse extends iUTXOResponse {
  utxos: EVMUTXOSet
}

export interface Asset {
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