/**
 * @packageDocumentation
 * @module AVM-Interfaces
 */

import { 
  iIndex,
  iUTXOID, 
  iUTXOResponse 
} from "./../../common/interfaces";
import { 
  Tx, 
  UTXOSet 
} from "./../../apis/avm";
import BN from "bn.js";
import { Buffer } from "buffer/"

export interface iGetBalanceResponse {
  balance: string
  utxoIDs: iUTXOID[] 
}

export interface iGetBalanceParams {
  address: string
  assetID: string
}

export interface iAVMUTXOResponse extends iUTXOResponse {
  utxos: UTXOSet
}

export interface iGetTxStatusParams {
  txID: string
}

export interface iGetTxStatusResponse {
  status: string
  epoch?: number
}

export interface iCreateAddressParams {
  username: string
  password: string
}    

export interface iCreateFixedCapAssetParams {
  username: string
  password: string 
  name: string
  symbol: string
  denomination: number
  initialHolders: object[]
}
export interface iMintParams {
  username: string
  password: string
  amount: number | BN | string
  assetID: Buffer | string
  to: string
  minters: string[]
}

export interface iExportKeyParams {
  username: string
  password: string
  address: string
}

export interface iImportKeyParams {
  username: string
  password: string
  privateKey: string
}

export interface iExportParams {
  username: string
  password: string
  to: string
  amount: BN | string
  assetID: string
}

export interface iExportAVAXParams {
  username: string
  password: string
  to: string
  amount: BN | string
}

export interface iImportParams {
  username: string
  password: string
  to: string
  sourceChain: string
}

export interface iImportAVAXParams {
  username: string
  password: string
  to: string
  sourceChain: string
}

export interface iListAddressesParams {
  username: string
  password: string
}

export interface iGetAllBalancesParams {
  address: string
}

export interface iBalance {
  asset: string
  balance: BN | string
}

export interface iGetAssetDescriptionParams {
  assetID: Buffer | string
}

export interface iGetAssetDescriptionResponse {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number

}

export interface iIssueTxParams {
  tx: string | Buffer | Tx
}

export interface iSendResponse {
  txID: string 
  changeAddr: string
}

export interface iSendParams {
  username: string
  password: string
  assetID: string | Buffer
  amount: number | BN | string
  to: string
  from?: string[] | Buffer[]
  changeAddr?: string
  memo?: string | Buffer
}

export interface iGetTxParams {
  txID: string
}

export interface iIssueTxParams {
  tx: string | Buffer | Tx
}

export interface iSendMultipleParams {
  username: string
  password: string
  sendOutputs: Array<iSendOutput>
  from: string[] | Buffer[]
  changeAddr: string
  memo: string | Buffer
}

export interface iSendMultipleResponse {
  txID: string 
  changeAddr: string
}

export interface iSendOutput {
  assetID: string | Buffer 
  amount: number | BN 
  to: string
}

export interface iGetUTXOsParams {
  addresses: string[] | string
  limit: number
  sourceChain?: string
  startIndex?: iIndex
}

export interface iCreateVariableCapAssetParams {
  username: string
  password: string
  name: string
  symbol: string
  denomination: number
  minterSets: object[]
}

export interface iAsset {
  name: string
  symbol: string
  assetID: Buffer
  denomination: number
}