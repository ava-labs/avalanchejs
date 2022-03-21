/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */

import BN from "bn.js"
import { PersistanceOptions } from "../../utils/persistenceoptions"
import { TransferableOutput } from "."
import { UTXOSet } from "../platformvm/utxos"

export interface GetStakeParams {
  addresses: string[]
  encoding: string
}

export interface GetStakeResponse {
  staked: BN
  stakedOutputs: TransferableOutput[]
}

export interface GetRewardUTXOsParams {
  txID: string
  encoding: string
}

export interface GetRewardUTXOsResponse {
  numFetched: number
  utxos: string[]
  encoding: string
}

export interface GetValidatorsAtParams {
  height: number
  subnetID?: string
}

export interface GetValidatorsAtResponse {
  validators: object
}

export interface GetCurrentValidatorsParams {
  subnetID?: Buffer | string
  nodeIDs?: string[]
}

export interface SampleValidatorsParams {
  size: number | string
  subnetID?: Buffer | string | undefined
}

export interface SampleValidatorsParams {
  size: number | string
  subnetID?: Buffer | string | undefined
}

export interface AddValidatorParams {
  username: string
  password: string
  nodeID: string
  startTime: number
  endTime: number
  stakeAmount: string
  rewardAddress: string
  delegationFeeRate?: string | undefined
}

export interface AddDelegatorParams {
  username: string
  password: string
  nodeID: string
  startTime: number
  endTime: number
  stakeAmount: string
  rewardAddress: string
}

export interface GetPendingValidatorsParams {
  subnetID?: Buffer | string
  nodeIDs?: string[]
}

export interface ExportAVAXParams {
  username: string
  password: string
  amount: string
  to: string
}

export interface ImportAVAXParams {
  username: string
  password: string
  sourceChain: string
  to: string
}

export interface ExportKeyParams {
  username: string
  password: string
  address: string
}

export interface ImportKeyParams {
  username: string
  password: string
  privateKey: string
}

export interface GetBalanceResponse {
  balance: BN | number
  unlocked: BN | number
  lockedStakeable: BN | number
  lockedNotStakeable: BN | number
  utxoIDs: {
    txID: string
    outputIndex: number
  }[]
}

export interface CreateAddressParams {
  username: string
  password: string
}

export interface ListAddressesParams {
  username: string
  password: string
}

export interface StartIndex {
  address: string
  utxo: string
}

export interface GetUTXOsParams {
  addresses: string[] | string
  sourceChain?: string | undefined
  limit: number | 0
  startIndex?: StartIndex | undefined
  persistOpts?: PersistanceOptions | undefined
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

export interface CreateSubnetParams {
  username: string
  password: string
  controlKeys: string[]
  threshold: number
}

export interface Subnet {
  ids: string
  controlKeys: string[]
  threshold: number
}

export interface CreateBlockchainParams {
  username: string
  password: string
  subnetID?: Buffer | string | undefined
  vmID: string
  fxIDs: number[]
  name: string
  genesisData: string
}

export interface Blockchain {
  id: string
  name: string
  subnetID: string
  vmID: string
}

export interface GetTxStatusParams {
  txID: string
  includeReason?: boolean | true
}

export interface GetTxStatusResponse {
  status: string
  reason: string
}

export interface GetMinStakeResponse {
  minValidatorStake: BN
  minDelegatorStake: BN
}

export interface GetMaxStakeAmountParams {
  subnetID?: string
  nodeID: string
  startTime: BN
  endTime: BN
}
