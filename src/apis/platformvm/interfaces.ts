/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */

import BN from "bn.js"
import { PersistanceOptions } from "../../utils/persistenceoptions"
import { TransferableInput, TransferableOutput } from "."
import { UTXOSet } from "./utxos"
import { OutputOwners } from "../../common/output"

export interface AddressParams {
  address: string
}

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
  verifyNodeSignature: boolean
  lockModeBondDeposit: boolean
}

export interface GetCurrentValidatorsParams {
  subnetID?: Buffer | string
  nodeIDs?: string[]
}

export interface GetClaimablesParams {
  addresses: string[]
  depositTxIDs: string[]
  locktime?: string
  threshold: number
}

export interface GetAllDepositOffersParams {
  active: boolean
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

export interface UTXOID {
  txID: string
  outputIndex: number
}

export interface BalanceDict {
  [assetId: string]: BN
}

export interface GetBalanceResponseAvax {
  balance: BN
  unlocked: BN
  lockedStakeable: BN
  lockedNotStakeable: BN
  utxoIDs: UTXOID[]
}

export interface GetBalanceResponseCamino {
  balances: BalanceDict
  unlockedOutputs: BalanceDict
  bondedOutputs: BalanceDict
  depositedOutputs: BalanceDict
  bondedDepositedOutputs: BalanceDict
  utxoIDs: UTXOID[]
}

export type GetBalanceResponse =
  | GetBalanceResponseAvax
  | GetBalanceResponseCamino

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

export interface GetClaimablesResponse {
  depositRewards: BN
  validatorRewards: BN
  expiredDepositRewards: BN
}

export interface GetAllDepositOffersResponse {
  depositOffers: DepositOffer[]
}

export interface DepositOffer {
  id: string
  interestRateNominator: BN
  start: BN
  end: BN
  minAmount: BN
  minDuration: number
  maxDuration: number
  unlockPeriodDuration: number
  noRewardsPeriodDuration: number
  memo: string
  flags: BN
}

export interface GetDepositsParams {
  depositTxIDs: string[]
}

export interface GetDepositsResponse {
  deposits: APIDeposit[]
}

export interface APIDeposit {
  depositTxID: string
  depositOfferID: string
  unlockedAmount: BN
  claimedRewardAmount: BN
  start: BN
  duration: number
  amount: BN
}

export interface GetMaxStakeAmountParams {
  subnetID?: string
  nodeID: string
  startTime: string
  endTime: string
}

export interface Owner {
  locktime: string
  threshold: number
  addresses: string[]
}

export interface MultisigAliasReply extends Owner {
  Memo: string
}

export interface SpendParams {
  from: string[] | string
  signer: string[] | string
  to?: Owner
  change?: Owner

  lockMode: 0 | 1 | 2
  amountToLock: string
  amountToBurn: string
  asOf: string
  encoding?: string
}

export interface SpendReply {
  ins: TransferableInput[]
  out: TransferableOutput[]
  owners: OutputOwners[]
}
