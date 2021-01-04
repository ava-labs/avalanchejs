/**
 * @packageDocumentation
 * @module Common-Interfaces
 */

import { Buffer } from 'buffer/';
import { UTXOSet as AVMUTXOSet } from 'src/apis/avm';
import { UTXOSet as EVMUTXOSet } from 'src/apis/evm';
import { UTXOSet as PlatformVMUTXOSet } from 'src/apis/platformvm';

export interface Index {
  address: string
  utxo: string
}

export interface AVMGetUTXOS {
  addresses: string[] | string,
  limit: number,
  startIndex?: Index,
  sourceChain?: string
}

export interface UTXOResponse {
  numFetched: number
  encoding: string
  endIndex: Index
}

export interface AVMUTXOResponse extends UTXOResponse {
  utxos: AVMUTXOSet
}

export interface PlatformVMUTXOResponse extends UTXOResponse {
  utxos: PlatformVMUTXOSet
}

export interface EVMUTXOResponse extends UTXOResponse {
  utxos: EVMUTXOSet
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