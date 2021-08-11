/**
 * @packageDocumentation
 * @module AVM-Interfaces
 */

import { Buffer } from "buffer/"
import BN from "bn.js"
import { CredsInterface } from "../../common"

export interface GetAVAXAssetIDParams {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}

export interface GetBalanceParams {
  address: string
  assetID: string
  includePartial: boolean
}

export interface CreateAddressParams extends CredsInterface {}

export interface CreateFixedCapAssetParams extends CredsInterface {
  name: string
  symbol: string
  denomination: number
  initialHolders: object[]
}

export interface CreateVariableCapAssetParams extends CredsInterface {
  name: string
  symbol: string
  denomination: number
  minterSets: object[]
}

export interface MintParams extends CredsInterface {
  amount: number | BN
  assetID: Buffer | string
  to: string
  minters: string[]
}

export interface ExportKeyParams extends CredsInterface {
  address: string
}

export interface ImportKeyParams extends CredsInterface {
  privateKey: string
}

export interface ExportParams extends CredsInterface {
  to: string
  amount: BN
  assetID: string
}

export interface ExportAVAXParams extends CredsInterface {
  to: string
  amount: BN
}

export interface ImportParams extends CredsInterface {
  to: string
  sourceChain: string
}

export interface ImportAVAXParams extends CredsInterface {
  to: string
  sourceChain: string
}

export interface ListAddressesParams extends CredsInterface {}

export interface GetAllBalancesParams {
  address: string
}

export interface GetAssetDescriptionParams {
  assetID: string
}

export interface GetTxParams {
  txID: string
}

export interface GetTxStatusParams {
  txID: string
}

export interface StartIndexInterface {
  address: string
  utxo: string
}

export interface GetUTXOsParams {
  addresses: string[] | string
  limit: number
  sourceChain?: string
  startIndex?: StartIndexInterface
}

export interface SOutputsParams {
  assetID: string
  amount: string
  to: string
}

export interface SendMultipleParams extends CredsInterface {
  outputs: SOutputsParams[]
  from?: string[] | Buffer[]
  changeAddr?: string
  memo?: string | Buffer
}

export interface BuildGenesisParams {
  genesisData: object
}
