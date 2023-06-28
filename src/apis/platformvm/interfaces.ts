/**
 * @packageDocumentation
 * @module PlatformVM-Interfaces
 */

import BN from "bn.js"
import { Buffer } from "buffer/"
import { PersistanceOptions } from "../../utils/persistenceoptions"
import { ClaimType, TransferableInput, TransferableOutput } from "."
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

export interface GetAllDepositOffersParams {
  timestamp: number
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

export interface Claimable {
  rewardOwner?: Owner
  validatorRewards: BN
  expiredDepositRewards: BN
}

export interface GetClaimablesResponse {
  claimables: Claimable[]
}

export interface GetAllDepositOffersResponse {
  depositOffers: DepositOffer[]
}

export interface DepositOffer {
  upgradeVersion: number
  id: string
  interestRateNominator: BN
  start: BN
  end: BN
  minAmount: BN
  totalMaxAmount: BN
  depositedAmount: BN
  minDuration: number
  maxDuration: number
  unlockPeriodDuration: number
  noRewardsPeriodDuration: number
  memo: string
  flags: BN
  totalMaxRewardAmount: BN
  rewardedAmount: BN
  ownerAddress?: string
}

export interface GetDepositsParams {
  depositTxIDs: string[]
}

export interface GetDepositsResponse {
  deposits: APIDeposit[]
  availableRewards: BN[]
  timestamp: BN
}

export interface APIDeposit {
  depositTxID: string
  depositOfferID: string
  unlockedAmount: BN
  claimedRewardAmount: BN
  start: BN
  duration: number
  amount: BN
  rewardOwner: Owner
}

export interface GetMaxStakeAmountParams {
  subnetID?: string
  nodeID: string
  startTime: string
  endTime: string
}

export interface Owner {
  locktime: BN
  threshold: number
  addresses: string[]
}

export interface OwnerParam {
  locktime: string
  threshold: number
  addresses: string[]
}

export interface MultisigAliasReply extends Owner {
  memo: string // hex encoded string
}

export interface MultisigAliasParams {
  id?: Buffer
  memo: string
  owners: OutputOwners
  auth: [number, Buffer][]
}

export interface SpendParams {
  from: string[] | string
  signer: string[] | string
  to?: OwnerParam
  change?: OwnerParam

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

export interface ClaimAmountParams {
  id?: Buffer
  claimType: ClaimType
  amount: BN
  owners: OutputOwners
  sigIdxs: number[]
}
