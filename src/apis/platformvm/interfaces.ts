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

export interface GetValidatorsAtParams {
  height: number
  subnetID?: string
}

export interface GetValidatorsAtResponse {
  validators: object
}

export interface GetConfigurationResponse {
  networkID: number
  assetID: string
  assetSymbol: string
  hrp: string
  blockchains: object[]
  minStakeDuration: number
  maxStakeDuration: number
  minValidatorStake: BN
  maxValidatorStake: BN
  minDelegationFee: BN
  minDelegatorStake: BN
  minConsumptionRate: number
  maxConsumptionRate: number
  supplyCap: BN
}
