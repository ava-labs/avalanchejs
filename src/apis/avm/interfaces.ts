/**
 * @packageDocumentation
 * @module AVM-Interfaces
 */

import { Buffer } from "buffer/"
import BN from "bn.js"

export interface GetAVAXAssetIDInterface {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}

export interface GetBalanceInterface {
  address: string
  assetID: string
}

export interface CreateAddressInterface {
  username: string
  password: string
}

export interface CreateFixedCapAssetInterface {
  username: string
  password: string
  name: string
  symbol: string
  denomination: number
  initialHolders: object[]
}

export interface CreateVariableCapAssetInterface {
  username: string
  password: string
  name: string
  symbol: string
  denomination: number
  minterSets: object[]
}

export interface MintInterface {
  username: string
  password: string
  amount: number | BN
  assetID: Buffer | string
  to: string
  minters: string[]
}

export interface ExportKeyInterface {
  username: string
  password: string
  address: string
}

export interface ImportKeyInterface {
  username: string
  password: string
  privateKey: string
}

export interface ExportInterface {
  username: string
  password: string
  to: string
  amount: BN
  assetID: string
}

export interface ExportAVAXInterface {
  username: string
  password: string
  to: string
  amount: BN
}

export interface ImportInterface {
  username: string
  password: string
  to: string
  sourceChain: string
}

export interface ImportAVAXInterface {
  username: string
  password: string
  to: string
  sourceChain: string
}

export interface ListAddressesInterface {
  username: string
  password: string
}

export interface GetAllBalancesInterface {
  address: string
}

export interface GetAssetDescriptionInterface {
  assetID: string
}

export interface GetTxInterface {
  txID: string
}

export interface GetTxStatusInterface {
  txID: string
}

export interface StartIndexInterface {
  address: string
  utxo: string
}

export interface GetUTXOsInterface {
  addresses: string[] | string
  limit: number
  sourceChain?: string
  startIndex?: StartIndexInterface
}

export interface IssueTxInterface {
  tx: string
}

export interface SOutputsInterface {
  assetID: string
  amount: string
  to: string
}

export interface SendMultipleInterface {
  username: string
  password: string
  outputs: SOutputsInterface[]
  from?: string[] | Buffer[]
  changeAddr?: string
  memo?: string | Buffer
}

export interface BuildGenesisInterface {
  genesisData: object
}
