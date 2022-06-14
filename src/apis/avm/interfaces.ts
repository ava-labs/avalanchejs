/**
 * @packageDocumentation
 * @module AVM-Interfaces
 */

import { Buffer } from "buffer/"
import BN from "bn.js"
import { CredsInterface } from "../../common"
import { UTXOSet } from "./utxos"

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

export interface GetBalanceResponse {
  balance: number | BN
  utxoIDs: iUTXOID[]
}

export interface iUTXOID {
  txID: string
  outputIndex: number
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

export interface ImportParams extends CredsInterface {
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

export interface GetAssetDescriptionResponse {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}

export interface GetTxParams {
  txID: string
  encoding: string
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
  encoding?: string
}

export interface EndIndex {
  address: string
  utxo: string
}

export interface GetUTXOsResponse {
  numFetched: number
  utxos: UTXOSet
  endIndex: EndIndex
}

export interface SOutputsParams {
  assetID: string
  amount: string
  to: string
}

export interface SendParams {
  username: string
  password: string
  assetID: string | Buffer
  amount: string
  to: string
  from?: string[] | Buffer[] | undefined
  changeAddr?: string | undefined
  memo?: string | Buffer | undefined
}

export interface SendResponse {
  txID: string
  changeAddr: string
}

export interface SendMultipleParams extends CredsInterface {
  outputs: SOutputsParams[]
  from?: string[] | Buffer[]
  changeAddr?: string
  memo?: string | Buffer
}

export interface SendMultipleResponse {
  txID: string
  changeAddr: string
}

export interface BuildGenesisParams {
  genesisData: object
}

export interface GetAddressTxsParams {
  address: string
  cursor: number
  pageSize: number
  assetID: string
}

export interface GetAddressTxsResponse {
  txIDs: string[]
  cursor: number
}

export interface CreateNFTAssetParams {
  username: string
  password: string
  from?: string[]
  changeAddr?: string
  name: string
  symbol: string
  minterSet: IMinterSet
}

export interface SendNFTParams {
  username: string
  password: string
  from?: string[]
  changeAddr?: string
  assetID: string
  groupID: number
  to: string
}

export interface MintNFTParams {
  username: string
  password: string
  from?: string[]
  changeAddr?: string
  assetID: string
  payload: string
  to: string
  encoding: string
}

export interface IMinterSet {
  threshold: number
  minters: string[]
}
