/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */

import { 
  iIndex,
  iUTXOID, 
  iUTXOResponse 
} from "./../../common/interfaces";
import { Tx, UTXOSet } from "./../../apis/platformvm";
import BN from "bn.js";
import { Buffer } from "buffer/";
import { PersistanceOptions } from "src/utils";

export interface iPlatformVMUTXOResponse extends iUTXOResponse {
  utxos:UTXOSet
}

export interface iGetBalanceResponse {
  balance:string
  unlocked:string
  lockedStakeable:string
  lockedNotStakeable:string
  utxoIDs:iUTXOID[] 
}

export interface iGetBalanceParams {
  address:string
}

export interface iGetMinStakeResponse {
  minValidatorStake:BN
  minDelegatorStake:BN
}

export interface iCreateBlockchainParams {
  username: string
  password: string
  vmID: string
  fxIDs: number[]
  name: string
  genesisData: string
  subnetID?: Buffer | string
}

export interface igetBlockchainStatusParams {
  blockchainID: string
}

export interface iUser {
  username: string
  password: string
}

export interface iCreateUserParams extends iUser {}

export interface iListAddressesParams extends iUser {}

export interface iValidatorsParams {
  subnetID?: Buffer | string
}
export interface iGetCurrentValidatorsParams extends iValidatorsParams {}

export interface iGetPendingValidators extends iValidatorsParams {}
export interface iSampleValidators extends iValidatorsParams {
  size: string
}

export interface iValidatorParams {
  username: string
  password: string
  nodeID: string
  startTime: Date | string | number
  endTime: Date | string | number
  stakeAmount?: BN | string
  rewardAddress?: string
}

export interface iAddValidatorParams extends iValidatorParams {
  delegationFeeRate?: BN | string
}

export interface iAddSubnetValidatorParams extends iValidatorParams {
  weight: number
  subnetID?: string
}

export interface iAddDelegatorParams extends iValidatorParams {}

export interface iCreateSubnetParams extends iUser {
  controlKeys: string[]
  threshold: number
}

export interface iValidatedByParams {
  blockchainID: string
}

export interface iValidatesParams {
  subnetID: Buffer | string
}

export interface iExportAVAXParams extends iUser {
  amount: BN | string
  to: string
}

export interface iImportAVAXParams extends iUser {
  to: string
  sourceChain: string
}

export interface iIssueTxParams {
  tx: string | Buffer | Tx
}

export interface iMinStake {
  minValidatorStake: BN 
  minDelegatorStake: BN
}

export interface iGetStakeParams {
  addresses: string[]
}

export interface iGetSubnetsParams {
  ids?: string[]
}

export interface iExportKeyParams extends iUser {
  address: string
}

export interface iImportKeyParams extends iUser {
  privateKey: string
}

export interface iGetTx {
  txID: string
}

export interface iGetTxParams extends iGetTx {}

export interface iGetTxStatusParams extends iGetTx {
  includeReason: boolean
}

export interface iStatus {
  status: string 
  reason: string
}

export interface iGetUTXOsParams {
  addresses: string[] | string
  limit: number
  sourceChain?: string
  startIndex?: iIndex 
  persistOpts?: PersistanceOptions
}