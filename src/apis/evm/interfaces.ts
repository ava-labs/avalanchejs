/**
 * @packageDocumentation
 * @module EVM-Interfaces
 */

import { Buffer } from "buffer/"
import { Index, CredsInterface } from "../../common"

export interface GetAssetDescriptionParams {
  assetID: Buffer | string
}

export interface GetAtomicTxStatusParams {
  txID: string
}

export interface GetAtomicTxParams {
  txID: string
}

export interface ExportAVAXParams extends CredsInterface {
  to: string
  amount: string
}

export interface ExportParams extends ExportAVAXParams {
  assetID: string
}

export interface GetUTXOsParams {
  addresses: string[] | string
  limit: number
  sourceChain?: string
  startIndex?: Index
}

export type BlockParameterString = "latest" | "earliest" | "pending"

export type BlockParameter = BlockParameterString | number

export interface TransactionParams {
  to: string
  from?: string
  gas?: string
  gasPrice?: string
  value?: string
  data?: string
}

export interface ImportAVAXParams extends CredsInterface {
  to: string
  sourceChain: string
}

export interface ImportParams extends ImportAVAXParams {}

export interface ImportKeyParams extends CredsInterface {
  privateKey: string
}

export interface ExportKeyParams extends CredsInterface {
  address: string
}
