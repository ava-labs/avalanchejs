/**
 * @packageDocumentation
 * @module API-EVM-Constants
 */

import BN from "bn.js"

export class EVMConstants {
  static SECPCREDENTIAL: number = 9

  static IMPORTTX: number = 0

  static EXPORTTX: number = 1

  static SECPINPUTID: number = 5

  static ASSETIDLEN: number = 32

  static SECPXFEROUTPUTID: number = 7

  static LATESTCODEC: number = 0

  static ADDRESSLENGTH: number = 20
}

export interface C {
  blockchainID: string
  alias: string
  vm: string
  fee?: BN
  gasPrice: BN | number
  chainID?: number
  minGasPrice?: BN
  maxGasPrice?: BN
  txBytesGas?: number
  costPerSignature?: number
  txFee?: BN
  avaxAssetID?: string
}
export interface X {
  blockchainID: string
  alias: string
  vm: string
  creationTxFee: BN | number
  avaxAssetID?: string
  txFee?: BN | number
  fee?: BN
}
export interface P {
  blockchainID: string
  alias: string
  vm: string
  creationTxFee: BN | number
  minConsumption: number
  maxConsumption: number
  maxStakingDuration: BN
  maxSupply: BN
  minStake: BN
  minStakeDuration: number
  maxStakeDuration: number
  minDelegationStake: BN
  minDelegationFee: BN
  avaxAssetID?: string
  txFee?: BN | number
  fee?: BN
}
export interface Network {
  C: C
  hrp: string
  X: X
  P: P
  [key: string]: C | X | P | string
}
export interface Networks {
  [key: number]: Network
}
