/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */

import BN from "bn.js"
import { TransferableOutput } from "."

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

export interface CurrentValidatorsResponse {
  validators: ValidatorInterface[]
}

export interface ValidatorInterface {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
  rewardOwner: RewardOwnerInterface
  potentialReward: string
  delegationFee: string
  uptime: string
  connected: boolean
  delegators: DelegatorInterface[]
}

export interface DelegatorInterface {
  txID: string
  startTime: string
  endTime: string
  stakeAmount: string
  nodeID: string
  rewardOwner: RewardOwnerInterface
  potentialReward: string
}

export interface RewardOwnerInterface {
  locktime: string
  threshold: string
  addresses: string[]
}

export interface GetValidatorsAtParams {
  height: number
  subnetID?: string
}

export interface GetValidatorsAtResponse {
  validators: object
}
