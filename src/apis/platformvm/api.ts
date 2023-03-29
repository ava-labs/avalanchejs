/**
 * @packageDocumentation
 * @module API-PlatformVM
 */
import { Buffer } from "buffer/"
import BN from "bn.js"
import AvalancheCore from "../../camino"
import {
  JRPCAPI,
  OutputOwners,
  RequestResponseData,
  ZeroBN
} from "../../common"

import {
  ErrorResponseObject,
  ProtocolError,
  UTXOError
} from "../../utils/errors"
import BinTools from "../../utils/bintools"
import { KeyChain } from "./keychain"
import { ONEAVAX } from "../../utils/constants"
import { PlatformVMConstants } from "./constants"
import { UnsignedTx, Tx } from "./tx"
import { PayloadBase } from "../../utils/payload"
import { UnixNow, NodeIDStringToBuffer } from "../../utils/helperfunctions"
import { UTXO, UTXOSet } from "../platformvm/utxos"
import { PersistanceOptions } from "../../utils/persistenceoptions"
import {
  AddressError,
  TransactionError,
  ChainIdError,
  GooseEggCheckError,
  TimeError,
  StakeError,
  DelegationFeeError
} from "../../utils/errors"
import {
  APIDeposit,
  BalanceDict,
  DepositOffer,
  GetCurrentValidatorsParams,
  GetPendingValidatorsParams,
  GetRewardUTXOsParams,
  GetRewardUTXOsResponse,
  GetStakeParams,
  GetStakeResponse,
  GetConfigurationResponse,
  Subnet,
  GetValidatorsAtParams,
  GetValidatorsAtResponse,
  CreateAddressParams,
  GetUTXOsParams,
  GetBalanceResponse,
  GetUTXOsResponse,
  ListAddressesParams,
  SampleValidatorsParams,
  AddValidatorParams,
  AddDelegatorParams,
  CreateSubnetParams,
  ExportAVAXParams,
  ExportKeyParams,
  ImportKeyParams,
  ImportAVAXParams,
  CreateBlockchainParams,
  Blockchain,
  GetTxStatusParams,
  GetTxStatusResponse,
  GetMinStakeResponse,
  GetMaxStakeAmountParams,
  SpendParams,
  SpendReply,
  AddressParams,
  MultisigAliasReply,
  GetClaimablesParams,
  GetClaimablesResponse,
  GetAllDepositOffersParams,
  GetAllDepositOffersResponse,
  GetDepositsParams,
  GetDepositsResponse
} from "./interfaces"
import { TransferableInput } from "./inputs"
import { TransferableOutput } from "./outputs"
import { Serialization, SerializedType } from "../../utils"
import { GenesisData } from "../avm"
import { Auth, LockMode, Builder, FromSigner } from "./builder"
import { Network } from "../../utils/networks"
import { Spender } from "./spender"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

const NanoBN = new BN(1000000000)
const rewardPercentDenom = 1000000

type FromType = String[] | String[][]

/**
 * Class for interacting with a node's PlatformVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class PlatformVMAPI extends JRPCAPI {
  /**
   * @ignore
   */
  protected keychain: KeyChain = new KeyChain("", "")

  protected blockchainID: string = ""

  protected blockchainAlias: string = undefined

  protected AVAXAssetID: Buffer = undefined

  protected txFee: BN = undefined

  protected creationTxFee: BN = undefined

  protected minValidatorStake: BN = undefined

  protected minDelegatorStake: BN = undefined

  /**
   * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
   *
   * @returns The alias for the blockchainID
   */
  getBlockchainAlias = (): string => {
    return this.core.getNetwork().P.alias
  }

  /**
   * Gets the current network, fetched via avalanche.fetchNetworkSettings.
   *
   * @returns The current Network
   */
  getNetwork = (): Network => {
    return this.core.getNetwork()
  }

  /**
   * Gets the blockchainID and returns it.
   *
   * @returns The blockchainID
   */
  getBlockchainID = (): string => this.blockchainID

  /**
   * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
   */
  parseAddress = (addr: string): Buffer => {
    const alias: string = this.getBlockchainAlias()
    const blockchainID: string = this.getBlockchainID()
    return bintools.parseAddress(
      addr,
      blockchainID,
      alias,
      PlatformVMConstants.ADDRESSLENGTH
    )
  }

  addressFromBuffer = (address: Buffer): string => {
    const chainid: string = this.getBlockchainAlias()
      ? this.getBlockchainAlias()
      : this.getBlockchainID()
    const type: SerializedType = "bech32"
    return serialization.bufferToType(
      address,
      type,
      this.core.getHRP(),
      chainid
    )
  }

  /**
   * Fetches the AVAX AssetID and returns it in a Promise.
   *
   * @param refresh This function caches the response. Refresh = true will bust the cache.
   *
   * @returns The the provided string representing the AVAX AssetID
   */
  getAVAXAssetID = async (refresh: boolean = false): Promise<Buffer> => {
    if (typeof this.AVAXAssetID === "undefined" || refresh) {
      this.AVAXAssetID = bintools.cb58Decode(
        this.core.getNetwork().X.avaxAssetID
      )
    }
    return this.AVAXAssetID
  }

  /**
   * Overrides the defaults and sets the cache to a specific AVAX AssetID
   *
   * @param avaxAssetID A cb58 string or Buffer representing the AVAX AssetID
   *
   * @returns The the provided string representing the AVAX AssetID
   */
  setAVAXAssetID = (avaxAssetID: string | Buffer) => {
    if (typeof avaxAssetID === "string") {
      avaxAssetID = bintools.cb58Decode(avaxAssetID)
    }
    this.AVAXAssetID = avaxAssetID
  }

  /**
   * Gets the default tx fee for this chain.
   *
   * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getDefaultTxFee = (): BN => {
    return new BN(this.core.getNetwork().P.txFee)
  }

  /**
   * Gets the tx fee for this chain.
   *
   * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getTxFee = (): BN => {
    if (typeof this.txFee === "undefined") {
      this.txFee = this.getDefaultTxFee()
    }
    return this.txFee
  }

  /**
   * Gets the CreateSubnetTx fee.
   *
   * @returns The CreateSubnetTx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getCreateSubnetTxFee = (): BN => {
    return new BN(this.core.getNetwork().P.createSubnetTx ?? 0)
  }

  /**
   * Gets the CreateChainTx fee.
   *
   * @returns The CreateChainTx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getCreateChainTxFee = (): BN => {
    return new BN(this.core.getNetwork().P.createChainTx ?? 0)
  }

  /**
   * Sets the tx fee for this chain.
   *
   * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
   */
  setTxFee = (fee: BN) => {
    this.txFee = fee
  }

  /**
   * Gets the default creation fee for this chain.
   *
   * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getDefaultCreationTxFee = (): BN => {
    return new BN(this.core.getNetwork().P.creationTxFee)
  }

  /**
   * Gets the creation fee for this chain.
   *
   * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getCreationTxFee = (): BN => {
    if (typeof this.creationTxFee === "undefined") {
      this.creationTxFee = this.getDefaultCreationTxFee()
    }
    return this.creationTxFee
  }

  /**
   * Sets the creation fee for this chain.
   *
   * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
   */
  setCreationTxFee = (fee: BN) => {
    this.creationTxFee = fee
  }

  /**
   * Gets a reference to the keychain for this class.
   *
   * @returns The instance of [[]] for this class
   */
  keyChain = (): KeyChain => this.keychain

  /**
   * @ignore
   */
  newKeyChain = (): KeyChain => {
    // warning, overwrites the old keychain
    const alias = this.getBlockchainAlias()
    if (alias) {
      this.keychain = new KeyChain(this.core.getHRP(), alias)
    } else {
      this.keychain = new KeyChain(this.core.getHRP(), this.blockchainID)
    }
    return this.keychain
  }

  /**
   * Helper function which determines if a tx is a goose egg transaction.
   *
   * @param utx An UnsignedTx
   *
   * @returns boolean true if passes goose egg test and false if fails.
   *
   * @remarks
   * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
   */
  checkGooseEgg = async (
    utx: UnsignedTx,
    outTotal: BN = ZeroBN
  ): Promise<boolean> => {
    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    let outputTotal: BN = outTotal.gt(ZeroBN)
      ? outTotal
      : utx.getOutputTotal(avaxAssetID)
    const fee: BN = utx.getBurn(avaxAssetID)
    if (fee.lte(ONEAVAX.mul(new BN(10))) || fee.lte(outputTotal)) {
      return true
    } else {
      return false
    }
  }

  /**
   * Retrieves an assetID for a subnet"s staking assset.
   *
   * @returns Returns a Promise string with cb58 encoded value of the assetID.
   */
  getStakingAssetID = async (): Promise<string> => {
    const response: RequestResponseData = await this.callMethod(
      "platform.getStakingAssetID"
    )
    return response.data.result.assetID
  }

  /**
   * Creates a new blockchain.
   *
   * @param username The username of the Keystore user that controls the new account
   * @param password The password of the Keystore user that controls the new account
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized string for the SubnetID or its alias.
   * @param vmID The ID of the Virtual Machine the blockchain runs. Can also be an alias of the Virtual Machine.
   * @param fxIDs The ids of the FXs the VM is running.
   * @param name A human-readable name for the new blockchain
   * @param genesis The base 58 (with checksum) representation of the genesis state of the new blockchain. Virtual Machines should have a static API method named buildGenesis that can be used to generate genesisData.
   *
   * @returns Promise for the unsigned transaction to create this blockchain. Must be signed by a sufficient number of the Subnet’s control keys and by the account paying the transaction fee.
   */
  createBlockchain = async (
    username: string,
    password: string,
    subnetID: Buffer | string = undefined,
    vmID: string,
    fxIDs: number[],
    name: string,
    genesis: string
  ): Promise<string> => {
    const params: CreateBlockchainParams = {
      username,
      password,
      fxIDs,
      vmID,
      name,
      genesisData: genesis
    }
    if (typeof subnetID === "string") {
      params.subnetID = subnetID
    } else if (typeof subnetID !== "undefined") {
      params.subnetID = bintools.cb58Encode(subnetID)
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.createBlockchain",
      params
    )
    return response.data.result.txID
  }

  /**
   * Gets the status of a blockchain.
   *
   * @param blockchainID The blockchainID requesting a status update
   *
   * @returns Promise for a string of one of: "Validating", "Created", "Preferred", "Unknown".
   */
  getBlockchainStatus = async (blockchainID: string): Promise<string> => {
    const params: any = {
      blockchainID
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getBlockchainStatus",
      params
    )
    return response.data.result.status
  }

  /**
   * Get the validators and their weights of a subnet or the Primary Network at a given P-Chain height.
   *
   * @param height The P-Chain height to get the validator set at.
   * @param subnetID Optional. A cb58 serialized string for the SubnetID or its alias.
   *
   * @returns Promise GetValidatorsAtResponse
   */
  getValidatorsAt = async (
    height: number,
    subnetID?: string
  ): Promise<GetValidatorsAtResponse> => {
    const params: GetValidatorsAtParams = {
      height
    }
    if (typeof subnetID !== "undefined") {
      params.subnetID = subnetID
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getValidatorsAt",
      params
    )
    return response.data.result
  }

  /**
   * Create an address in the node's keystore.
   *
   * @param username The username of the Keystore user that controls the new account
   * @param password The password of the Keystore user that controls the new account
   *
   * @returns Promise for a string of the newly created account address.
   */
  createAddress = async (
    username: string,
    password: string
  ): Promise<string> => {
    const params: CreateAddressParams = {
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.createAddress",
      params
    )
    return response.data.result.address
  }

  /**
   * Gets the balance of a particular asset.
   *
   * @param address The address to pull the asset balance from
   *
   * @returns Promise with the balance as a {@link https://github.com/indutny/bn.js/|BN} on the provided address.
   */
  getBalance = async (params: {
    address?: string
    addresses?: string[]
  }): Promise<GetBalanceResponse> => {
    if (
      params.address &&
      typeof this.parseAddress(params.address) === "undefined"
    ) {
      /* istanbul ignore next */
      throw new AddressError(
        "Error - PlatformVMAPI.getBalance: Invalid address format"
      )
    }
    params.addresses?.forEach((address) => {
      if (typeof this.parseAddress(address) === "undefined") {
        /* istanbul ignore next */
        throw new AddressError(
          "Error - PlatformVMAPI.getBalance: Invalid address format"
        )
      }
    })
    const response: RequestResponseData = await this.callMethod(
      "platform.getBalance",
      params
    )

    const result = response.data.result

    const parseDict = (input: any[]): BalanceDict => {
      let dict: BalanceDict = {}
      for (const [k, v] of Object.entries(input)) dict[k] = new BN(v)
      return dict as BalanceDict
    }

    if (this.core.getNetwork().P.lockModeBondDeposit) {
      return {
        balances: parseDict(result.balances),
        unlockedOutputs: parseDict(result.unlockedOutputs),
        bondedOutputs: parseDict(result.bondedOutputs),
        depositedOutputs: parseDict(result.depositedOutputs),
        bondedDepositedOutputs: parseDict(result.bondedDepositedOutputs),
        utxoIDs: result.utxoIDs
      } as GetBalanceResponse
    }
    return {
      balance: new BN(result.balance),
      unlocked: new BN(result.unlocked),
      lockedStakeable: new BN(result.lockedStakeable),
      lockedNotStakeable: new BN(result.lockedNotStakeable),
      utxoIDs: result.utxoIDs
    } as GetBalanceResponse
  }

  /**
   * List the addresses controlled by the user.
   *
   * @param username The username of the Keystore user
   * @param password The password of the Keystore user
   *
   * @returns Promise for an array of addresses.
   */
  listAddresses = async (
    username: string,
    password: string
  ): Promise<string[]> => {
    const params: ListAddressesParams = {
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.listAddresses",
      params
    )
    return response.data.result.addresses
  }

  /**
   * Lists the set of current validators.
   *
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
   * cb58 serialized string for the SubnetID or its alias.
   * @param nodeIDs Optional. An array of strings
   *
   * @returns Promise for an array of validators that are currently staking, see: {@link https://docs.avax.network/v1.0/en/api/platform/#platformgetcurrentvalidators|platform.getCurrentValidators documentation}.
   *
   */
  getCurrentValidators = async (
    subnetID: Buffer | string = undefined,
    nodeIDs: string[] = undefined
  ): Promise<object> => {
    const params: GetCurrentValidatorsParams = {}
    if (typeof subnetID === "string") {
      params.subnetID = subnetID
    } else if (typeof subnetID !== "undefined") {
      params.subnetID = bintools.cb58Encode(subnetID)
    }
    if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
      params.nodeIDs = nodeIDs
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getCurrentValidators",
      params
    )
    return response.data.result
  }

  /**
   * A request that in address field accepts either a nodeID (and returns a bech32 address if it exists), or a bech32 address (and returns a NodeID if it exists).
   *
   * @param address A nodeID or a bech32 address
   *
   * @returns Promise for a string containing bech32 address that is the node owner or nodeID that the address passed is an owner of.
   */
  getRegisteredShortIDLink = async (address: string): Promise<string> => {
    const params = {
      address
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getRegisteredShortIDLink",
      params
    )
    return response.data.result.address
  }

  /**
   * Returns active or inactive deposit offers.
   *
   * @param active A boolean indicating whether to return active or inactive deposit offers.
   *
   * @returns Promise for a list containing deposit offers.
   */
  getAllDepositOffers = async (active?: boolean): Promise<DepositOffer[]> => {
    const params: GetAllDepositOffersParams = {
      active
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getAllDepositOffers",
      params
    )

    const offers: GetAllDepositOffersResponse = response.data.result
    return offers.depositOffers.map((offer) => {
      return {
        id: offer.id,
        interestRateNominator: new BN(offer.interestRateNominator),
        start: new BN(offer.start),
        end: new BN(offer.end),
        minAmount: new BN(offer.minAmount),
        minDuration: offer.minDuration,
        maxDuration: offer.maxDuration,
        unlockPeriodDuration: offer.unlockPeriodDuration,
        noRewardsPeriodDuration: offer.noRewardsPeriodDuration,
        memo: offer.memo,
        flags: new BN(offer.flags)
      } as DepositOffer
    })
  }

  /**
   * Returns deposits coressponding to requested txIDs.
   *
   * @param depositTxIDs A list of txIDs (cb58) to request deposits for.
   *
   * @returns Promise for a list containing deposits.
   */
  getDeposits = async (depositTxIDs: string[]): Promise<APIDeposit[]> => {
    const params: GetDepositsParams = {
      depositTxIDs
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getDeposits",
      params
    )

    const deposits: GetDepositsResponse = response.data.result
    return deposits.deposits.map((deposit) => {
      return {
        depositTxID: deposit.depositTxID,
        depositOfferID: deposit.depositOfferID,
        unlockedAmount: new BN(deposit.unlockedAmount),
        claimedRewardAmount: new BN(deposit.claimedRewardAmount),
        start: new BN(deposit.start),
        duration: deposit.duration,
        amount: new BN(deposit.amount)
      } as APIDeposit
    })
  }

  /**
   * List amounts that can be claimed: validator rewards, expired deposit rewards, active deposit rewards claimable at current time.
   *
   * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
   * @param depositTxIDs An array of deposit transactions ids
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   *
   * @returns Promise for an object containing the amounts that can be claimed.
   */
  getClaimables = async (
    addresses: string[],
    depositTxIDs: string[],
    locktime: string = undefined,
    threshold: number = 1
  ): Promise<GetClaimablesResponse> => {
    const params: GetClaimablesParams = {
      threshold,
      addresses,
      depositTxIDs
    }
    if (typeof locktime !== "undefined") {
      params.locktime = locktime
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getClaimables",
      params
    )
    const result = response.data.result
    return {
      depositRewards: new BN(result.depositRewards),
      validatorRewards: new BN(result.validatorRewards),
      expiredDepositRewards: new BN(result.expiredDepositRewards)
    } as GetClaimablesResponse
  }

  /**
   * Lists the set of pending validators.
   *
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer}
   * or a cb58 serialized string for the SubnetID or its alias.
   * @param nodeIDs Optional. An array of strings
   *
   * @returns Promise for an array of validators that are pending staking, see: {@link https://docs.avax.network/v1.0/en/api/platform/#platformgetpendingvalidators|platform.getPendingValidators documentation}.
   *
   */
  getPendingValidators = async (
    subnetID: Buffer | string = undefined,
    nodeIDs: string[] = undefined
  ): Promise<object> => {
    const params: GetPendingValidatorsParams = {}
    if (typeof subnetID === "string") {
      params.subnetID = subnetID
    } else if (typeof subnetID !== "undefined") {
      params.subnetID = bintools.cb58Encode(subnetID)
    }
    if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
      params.nodeIDs = nodeIDs
    }

    const response: RequestResponseData = await this.callMethod(
      "platform.getPendingValidators",
      params
    )
    return response.data.result
  }

  /**
   * Samples `Size` validators from the current validator set.
   *
   * @param sampleSize Of the total universe of validators, select this many at random
   * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
   * cb58 serialized string for the SubnetID or its alias.
   *
   * @returns Promise for an array of validator"s stakingIDs.
   */
  sampleValidators = async (
    sampleSize: number,
    subnetID: Buffer | string = undefined
  ): Promise<string[]> => {
    const params: SampleValidatorsParams = {
      size: sampleSize.toString()
    }
    if (typeof subnetID === "string") {
      params.subnetID = subnetID
    } else if (typeof subnetID !== "undefined") {
      params.subnetID = bintools.cb58Encode(subnetID)
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.sampleValidators",
      params
    )
    return response.data.result.validators
  }

  /**
   * Add a validator to the Primary Network.
   *
   * @param username The username of the Keystore user
   * @param password The password of the Keystore user
   * @param nodeID The node ID of the validator
   * @param startTime Javascript Date object for the start time to validate
   * @param endTime Javascript Date object for the end time to validate
   * @param stakeAmount The amount of nAVAX the validator is staking as
   * a {@link https://github.com/indutny/bn.js/|BN}
   * @param rewardAddress The address the validator reward will go to, if there is one.
   * @param delegationFeeRate Optional. A {@link https://github.com/indutny/bn.js/|BN} for the percent fee this validator
   * charges when others delegate stake to them. Up to 4 decimal places allowed additional decimal places are ignored.
   * Must be between 0 and 100, inclusive. For example, if delegationFeeRate is 1.2345 and someone delegates to this
   * validator, then when the delegation period is over, 1.2345% of the reward goes to the validator and the rest goes
   * to the delegator.
   *
   * @returns Promise for a base58 string of the unsigned transaction.
   */
  addValidator = async (
    username: string,
    password: string,
    nodeID: string,
    startTime: Date,
    endTime: Date,
    stakeAmount: BN,
    rewardAddress: string,
    delegationFeeRate: BN = undefined
  ): Promise<string> => {
    const params: AddValidatorParams = {
      username,
      password,
      nodeID,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      stakeAmount: stakeAmount.toString(10),
      rewardAddress
    }
    if (typeof delegationFeeRate !== "undefined") {
      params.delegationFeeRate = delegationFeeRate.toString(10)
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.addValidator",
      params
    )
    return response.data.result.txID
  }

  /**
   * Add a validator to a Subnet other than the Primary Network. The validator must validate the Primary Network for the entire duration they validate this Subnet.
   *
   * @param username The username of the Keystore user
   * @param password The password of the Keystore user
   * @param nodeID The node ID of the validator
   * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58 serialized string for the SubnetID or its alias.
   * @param startTime Javascript Date object for the start time to validate
   * @param endTime Javascript Date object for the end time to validate
   * @param weight The validator’s weight used for sampling
   *
   * @returns Promise for the unsigned transaction. It must be signed (using sign) by the proper number of the Subnet’s control keys and by the key of the account paying the transaction fee before it can be issued.
   */
  addSubnetValidator = async (
    username: string,
    password: string,
    nodeID: string,
    subnetID: Buffer | string,
    startTime: Date,
    endTime: Date,
    weight: number
  ): Promise<string> => {
    const params: any = {
      username,
      password,
      nodeID,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      weight
    }
    if (typeof subnetID === "string") {
      params.subnetID = subnetID
    } else if (typeof subnetID !== "undefined") {
      params.subnetID = bintools.cb58Encode(subnetID)
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.addSubnetValidator",
      params
    )
    return response.data.result.txID
  }

  /**
   * Add a delegator to the Primary Network.
   *
   * @param username The username of the Keystore user
   * @param password The password of the Keystore user
   * @param nodeID The node ID of the delegatee
   * @param startTime Javascript Date object for when the delegator starts delegating
   * @param endTime Javascript Date object for when the delegator starts delegating
   * @param stakeAmount The amount of nAVAX the delegator is staking as
   * a {@link https://github.com/indutny/bn.js/|BN}
   * @param rewardAddress The address of the account the staked AVAX and validation reward
   * (if applicable) are sent to at endTime
   *
   * @returns Promise for an array of validator"s stakingIDs.
   */
  addDelegator = async (
    username: string,
    password: string,
    nodeID: string,
    startTime: Date,
    endTime: Date,
    stakeAmount: BN,
    rewardAddress: string
  ): Promise<string> => {
    const params: AddDelegatorParams = {
      username,
      password,
      nodeID,
      startTime: startTime.getTime() / 1000,
      endTime: endTime.getTime() / 1000,
      stakeAmount: stakeAmount.toString(10),
      rewardAddress
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.addDelegator",
      params
    )
    return response.data.result.txID
  }

  /**
   * Create an unsigned transaction to create a new Subnet. The unsigned transaction must be
   * signed with the key of the account paying the transaction fee. The Subnet’s ID is the ID of the transaction that creates it (ie the response from issueTx when issuing the signed transaction).
   *
   * @param username The username of the Keystore user
   * @param password The password of the Keystore user
   * @param controlKeys Array of platform addresses as strings
   * @param threshold To add a validator to this Subnet, a transaction must have threshold
   * signatures, where each signature is from a key whose address is an element of `controlKeys`
   *
   * @returns Promise for a string with the unsigned transaction encoded as base58.
   */
  createSubnet = async (
    username: string,
    password: string,
    controlKeys: string[],
    threshold: number
  ): Promise<string | ErrorResponseObject> => {
    const params: CreateSubnetParams = {
      username,
      password,
      controlKeys,
      threshold
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.createSubnet",
      params
    )
    return response.data.result.txID
      ? response.data.result.txID
      : response.data.result
  }

  /**
   * Get the Subnet that validates a given blockchain.
   *
   * @param blockchainID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58
   * encoded string for the blockchainID or its alias.
   *
   * @returns Promise for a string of the subnetID that validates the blockchain.
   */
  validatedBy = async (blockchainID: string): Promise<string> => {
    const params: any = {
      blockchainID
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.validatedBy",
      params
    )
    return response.data.result.subnetID
  }

  /**
   * Get the IDs of the blockchains a Subnet validates.
   *
   * @param subnetID Either a {@link https://github.com/feross/buffer|Buffer} or an AVAX
   * serialized string for the SubnetID or its alias.
   *
   * @returns Promise for an array of blockchainIDs the subnet validates.
   */
  validates = async (subnetID: Buffer | string): Promise<string[]> => {
    const params: any = {
      subnetID
    }
    if (typeof subnetID === "string") {
      params.subnetID = subnetID
    } else if (typeof subnetID !== "undefined") {
      params.subnetID = bintools.cb58Encode(subnetID)
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.validates",
      params
    )
    return response.data.result.blockchainIDs
  }

  /**
   * Get all the blockchains that exist (excluding the P-Chain).
   *
   * @returns Promise for an array of objects containing fields "id", "subnetID", and "vmID".
   */
  getBlockchains = async (): Promise<Blockchain[]> => {
    const response: RequestResponseData = await this.callMethod(
      "platform.getBlockchains"
    )
    return response.data.result.blockchains
  }

  /**
   * Send AVAX from an account on the P-Chain to an address on the X-Chain. This transaction
   * must be signed with the key of the account that the AVAX is sent from and which pays the
   * transaction fee. After issuing this transaction, you must call the X-Chain’s importAVAX
   * method to complete the transfer.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The address on the X-Chain to send the AVAX to. Do not include X- in the address
   * @param amount Amount of AVAX to export as a {@link https://github.com/indutny/bn.js/|BN}
   *
   * @returns Promise for an unsigned transaction to be signed by the account the the AVAX is
   * sent from and pays the transaction fee.
   */
  exportAVAX = async (
    username: string,
    password: string,
    amount: BN,
    to: string
  ): Promise<string | ErrorResponseObject> => {
    const params: ExportAVAXParams = {
      username,
      password,
      to,
      amount: amount.toString(10)
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.exportAVAX",
      params
    )
    return response.data.result.txID
      ? response.data.result.txID
      : response.data.result
  }

  /**
   * Send AVAX from an account on the P-Chain to an address on the X-Chain. This transaction
   * must be signed with the key of the account that the AVAX is sent from and which pays
   * the transaction fee. After issuing this transaction, you must call the X-Chain’s
   * importAVAX method to complete the transfer.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The ID of the account the AVAX is sent to. This must be the same as the to
   * argument in the corresponding call to the X-Chain’s exportAVAX
   * @param sourceChain The chainID where the funds are coming from.
   *
   * @returns Promise for a string for the transaction, which should be sent to the network
   * by calling issueTx.
   */
  importAVAX = async (
    username: string,
    password: string,
    to: string,
    sourceChain: string
  ): Promise<string | ErrorResponseObject> => {
    const params: ImportAVAXParams = {
      to,
      sourceChain,
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.importAVAX",
      params
    )
    return response.data.result.txID
      ? response.data.result.txID
      : response.data.result
  }

  /**
   * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
   *
   * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
   *
   * @returns A Promise string representing the transaction ID of the posted transaction.
   */
  issueTx = async (tx: string | Buffer | Tx): Promise<string> => {
    let Transaction = ""
    if (typeof tx === "string") {
      Transaction = tx
    } else if (tx instanceof Buffer) {
      const txobj: Tx = new Tx()
      txobj.fromBuffer(tx)
      Transaction = txobj.toStringHex()
    } else if (tx instanceof Tx) {
      Transaction = tx.toStringHex()
    } else {
      /* istanbul ignore next */
      throw new TransactionError(
        "Error - platform.issueTx: provided tx is not expected type of string, Buffer, or Tx"
      )
    }
    const params: any = {
      tx: Transaction.toString(),
      encoding: "hex"
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.issueTx",
      params
    )
    return response.data.result.txID
  }

  /**
   * Returns an upper bound on the amount of tokens that exist. Not monotonically increasing because this number can go down if a staker"s reward is denied.
   */
  getCurrentSupply = async (): Promise<BN> => {
    const response: RequestResponseData = await this.callMethod(
      "platform.getCurrentSupply"
    )
    return new BN(response.data.result.supply, 10)
  }

  /**
   * Returns the height of the platform chain.
   */
  getHeight = async (): Promise<BN> => {
    const response: RequestResponseData = await this.callMethod(
      "platform.getHeight"
    )
    return new BN(response.data.result.height, 10)
  }

  /**
   * Gets the minimum staking amount.
   *
   * @param refresh A boolean to bypass the local cached value of Minimum Stake Amount, polling the node instead.
   */
  getMinStake = async (
    refresh: boolean = false
  ): Promise<GetMinStakeResponse> => {
    if (
      refresh !== true &&
      typeof this.minValidatorStake !== "undefined" &&
      typeof this.minDelegatorStake !== "undefined"
    ) {
      return {
        minValidatorStake: this.minValidatorStake,
        minDelegatorStake: this.minDelegatorStake
      }
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getMinStake"
    )
    this.minValidatorStake = new BN(response.data.result.minValidatorStake, 10)
    this.minDelegatorStake = new BN(response.data.result.minDelegatorStake, 10)
    return {
      minValidatorStake: this.minValidatorStake,
      minDelegatorStake: this.minDelegatorStake
    }
  }

  /**
   * getTotalStake() returns the total amount staked on the Primary Network
   *
   * @returns A big number representing total staked by validators on the primary network
   */
  getTotalStake = async (): Promise<BN> => {
    const response: RequestResponseData = await this.callMethod(
      "platform.getTotalStake"
    )
    return new BN(response.data.result.stake, 10)
  }

  /**
   * getMaxStakeAmount() returns the maximum amount of nAVAX staking to the named node during the time period.
   *
   * @param subnetID A Buffer or cb58 string representing subnet
   * @param nodeID A string representing ID of the node whose stake amount is required during the given duration
   * @param startTime A big number denoting start time of the duration during which stake amount of the node is required.
   * @param endTime A big number denoting end time of the duration during which stake amount of the node is required.
   * @returns A big number representing total staked by validators on the primary network
   */
  getMaxStakeAmount = async (
    subnetID: string | Buffer,
    nodeID: string,
    startTime: BN,
    endTime: BN
  ): Promise<BN> => {
    const now: BN = UnixNow()
    if (startTime.gt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "PlatformVMAPI.getMaxStakeAmount -- startTime must be in the past and endTime must come after startTime"
      )
    }

    const params: GetMaxStakeAmountParams = {
      nodeID: nodeID,
      startTime: startTime.toString(10),
      endTime: endTime.toString(10)
    }

    if (typeof subnetID === "string") {
      params.subnetID = subnetID
    } else if (typeof subnetID !== "undefined") {
      params.subnetID = bintools.cb58Encode(subnetID)
    }

    const response: RequestResponseData = await this.callMethod(
      "platform.getMaxStakeAmount",
      params
    )
    return new BN(response.data.result.amount, 10)
  }

  /**
   * Sets the minimum stake cached in this class.
   * @param minValidatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum stake amount cached in this class.
   * @param minDelegatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum delegation amount cached in this class.
   */
  setMinStake = (
    minValidatorStake: BN = undefined,
    minDelegatorStake: BN = undefined
  ): void => {
    if (typeof minValidatorStake !== "undefined") {
      this.minValidatorStake = minValidatorStake
    }
    if (typeof minDelegatorStake !== "undefined") {
      this.minDelegatorStake = minDelegatorStake
    }
  }

  /**
   * Gets the total amount staked for an array of addresses.
   */
  getStake = async (
    addresses: string[],
    encoding: string = "hex"
  ): Promise<GetStakeResponse> => {
    const params: GetStakeParams = {
      addresses,
      encoding
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getStake",
      params
    )
    return {
      staked: new BN(response.data.result.staked, 10),
      stakedOutputs: response.data.result.stakedOutputs.map(
        (stakedOutput: string): TransferableOutput => {
          const transferableOutput: TransferableOutput =
            new TransferableOutput()
          let buf: Buffer
          if (encoding === "cb58") {
            buf = bintools.cb58Decode(stakedOutput)
          } else {
            buf = Buffer.from(stakedOutput.replace(/0x/g, ""), "hex")
          }
          transferableOutput.fromBuffer(buf, 2)
          return transferableOutput
        }
      )
    }
  }

  /**
   * Get all the subnets that exist.
   *
   * @param ids IDs of the subnets to retrieve information about. If omitted, gets all subnets
   *
   * @returns Promise for an array of objects containing fields "id",
   * "controlKeys", and "threshold".
   */
  getSubnets = async (ids: string[] = undefined): Promise<Subnet[]> => {
    const params: any = {}
    if (typeof ids !== undefined) {
      params.ids = ids
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getSubnets",
      params
    )
    return response.data.result.subnets
  }

  /**
   * Exports the private key for an address.
   *
   * @param username The name of the user with the private key
   * @param password The password used to decrypt the private key
   * @param address The address whose private key should be exported
   *
   * @returns Promise with the decrypted private key as store in the database
   */
  exportKey = async (
    username: string,
    password: string,
    address: string
  ): Promise<string | ErrorResponseObject> => {
    const params: ExportKeyParams = {
      username,
      password,
      address
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.exportKey",
      params
    )
    return response.data.result.privateKey
      ? response.data.result.privateKey
      : response.data.result
  }

  /**
   * Give a user control over an address by providing the private key that controls the address.
   *
   * @param username The name of the user to store the private key
   * @param password The password that unlocks the user
   * @param privateKey A string representing the private key in the vm"s format
   *
   * @returns The address for the imported private key.
   */
  importKey = async (
    username: string,
    password: string,
    privateKey: string
  ): Promise<string | ErrorResponseObject> => {
    const params: ImportKeyParams = {
      username,
      password,
      privateKey
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.importKey",
      params
    )

    return response.data.result.address
      ? response.data.result.address
      : response.data.result
  }

  /**
   * Returns the treansaction data of a provided transaction ID by calling the node's `getTx` method.
   *
   * @param txID The string representation of the transaction ID
   * @param encoding sets the format of the returned transaction. Can be, "cb58", "hex" or "json". Defaults to "cb58".
   *
   * @returns Returns a Promise string or object containing the bytes retrieved from the node
   */
  getTx = async (
    txID: string,
    encoding: string = "hex"
  ): Promise<string | object> => {
    const params: any = {
      txID,
      encoding
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getTx",
      params
    )
    return response.data.result.tx
      ? response.data.result.tx
      : response.data.result
  }

  /**
   * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
   *
   * @param txid The string representation of the transaction ID
   * @param includeReason Return the reason tx was dropped, if applicable. Defaults to true
   *
   * @returns Returns a Promise string containing the status retrieved from the node and the reason a tx was dropped, if applicable.
   */
  getTxStatus = async (
    txid: string,
    includeReason: boolean = true
  ): Promise<string | GetTxStatusResponse> => {
    const params: GetTxStatusParams = {
      txID: txid,
      includeReason: includeReason
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getTxStatus",
      params
    )
    return response.data.result
  }

  /**
   * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
   *
   * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
   * @param sourceChain A string for the chain to look for the UTXO"s. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
   * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
   * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
   * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
   * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
   * @param persistOpts Options available to persist these UTXOs in local storage
   * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
   *
   * @remarks
   * persistOpts is optional and must be of type [[PersistanceOptions]]
   *
   */
  getUTXOs = async (
    addresses: string[] | string,
    sourceChain: string = undefined,
    limit: number = 0,
    startIndex: { address: string; utxo: string } = undefined,
    persistOpts: PersistanceOptions = undefined,
    encoding: string = "hex"
  ): Promise<GetUTXOsResponse> => {
    if (typeof addresses === "string") {
      addresses = [addresses]
    }

    const params: GetUTXOsParams = {
      addresses: addresses,
      limit,
      encoding
    }
    if (typeof startIndex !== "undefined" && startIndex) {
      params.startIndex = startIndex
    }

    if (typeof sourceChain !== "undefined") {
      params.sourceChain = sourceChain
    }

    const response: RequestResponseData = await this.callMethod(
      "platform.getUTXOs",
      params
    )

    const utxos: UTXOSet = new UTXOSet()
    let data = response.data.result.utxos
    if (persistOpts && typeof persistOpts === "object") {
      if (this.db.has(persistOpts.getName())) {
        const selfArray: string[] = this.db.get(persistOpts.getName())
        if (Array.isArray(selfArray)) {
          utxos.addArray(data)
          const self: UTXOSet = new UTXOSet()
          self.addArray(selfArray)
          self.mergeByRule(utxos, persistOpts.getMergeRule())
          data = self.getAllUTXOStrings()
        }
      }
      this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite())
    }

    if (data.length > 0 && data[0].substring(0, 2) === "0x") {
      const cb58Strs: string[] = []
      data.forEach((str: string): void => {
        cb58Strs.push(bintools.cb58Encode(Buffer.from(str.slice(2), "hex")))
      })

      utxos.addArray(cb58Strs, false)
    } else {
      utxos.addArray(data, false)
    }
    response.data.result.utxos = utxos
    response.data.result.numFetched = parseInt(response.data.result.numFetched)
    return response.data.result
  }

  /**
   * getAddressStates() returns an 64 bit bitmask of states applied to address
   *
   * @returns A big number representing the states applied to given address
   */
  getAddressStates = async (address: string): Promise<BN> => {
    const params: AddressParams = {
      address: address
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getAddressStates",
      params
    )
    return new BN(response.data.result, 10)
  }

  /**
   * getMultisigAlias() returns a MultisigAliasReply
   *
   * @returns A MultiSigAlias
   */
  getMultisigAlias = async (address: string): Promise<MultisigAliasReply> => {
    const params: AddressParams = {
      address: address
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getMultisigAlias",
      params
    )
    return response.data.result
  }

  /**
   * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param ownerAddresses The addresses being used to import
   * @param sourceChain The chainid for where the import is coming from.
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
   *
   * @remarks
   * This helper exists because the endpoint API should be the primary point of entry for most functionality.
   */
  buildImportTx = async (
    utxoset: UTXOSet,
    ownerAddresses: string[],
    sourceChain: Buffer | string,
    toAddresses: string[],
    fromAddresses: FromType,
    changeAddresses: string[] = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    locktime: BN = ZeroBN,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildImportTx"

    const to: Buffer[] = this._cleanAddressArrayBuffer(toAddresses, caller)

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )

    let srcChain: string = undefined

    if (typeof sourceChain === "undefined") {
      throw new ChainIdError(
        "Error - PlatformVMAPI.buildImportTx: Source ChainID is undefined."
      )
    } else if (typeof sourceChain === "string") {
      srcChain = sourceChain
      sourceChain = bintools.cb58Decode(sourceChain)
    } else if (!(sourceChain instanceof Buffer)) {
      throw new ChainIdError(
        "Error - PlatformVMAPI.buildImportTx: Invalid destinationChain type: " +
          typeof sourceChain
      )
    }
    const atomicUTXOs: UTXOSet = await (
      await this.getUTXOs(ownerAddresses, srcChain, 0, undefined)
    ).utxos
    const avaxAssetID: Buffer = await this.getAVAXAssetID()

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const atomics: UTXO[] = atomicUTXOs.getAllUTXOs()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildImportTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID),
      to,
      fromSigner,
      change,
      atomics,
      sourceChain,
      this.getTxFee(),
      avaxAssetID,
      memo,
      asOf,
      locktime,
      toThreshold,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
   * @param destinationChain The chainid for where the assets will be sent.
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
   */
  buildExportTx = async (
    utxoset: UTXOSet,
    amount: BN,
    destinationChain: Buffer | string,
    toAddresses: string[],
    fromAddresses: FromType,
    changeAddresses: string[] = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    locktime: BN = ZeroBN,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildExportTx"

    let prefixes: object = {}
    toAddresses.map((a: string): void => {
      prefixes[a.split("-")[0]] = true
    })
    if (Object.keys(prefixes).length !== 1) {
      throw new AddressError(
        "Error - PlatformVMAPI.buildExportTx: To addresses must have the same chainID prefix."
      )
    }

    if (typeof destinationChain === "undefined") {
      throw new ChainIdError(
        "Error - PlatformVMAPI.buildExportTx: Destination ChainID is undefined."
      )
    } else if (typeof destinationChain === "string") {
      destinationChain = bintools.cb58Decode(destinationChain) //
    } else if (!(destinationChain instanceof Buffer)) {
      throw new ChainIdError(
        "Error - PlatformVMAPI.buildExportTx: Invalid destinationChain type: " +
          typeof destinationChain
      )
    }
    if (destinationChain.length !== 32) {
      throw new ChainIdError(
        "Error - PlatformVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length."
      )
    }

    let to: Buffer[] = []
    toAddresses.map((a: string): void => {
      to.push(bintools.stringToAddress(a))
    })

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildExportTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID),
      amount,
      avaxAssetID,
      to,
      fromSigner,
      destinationChain,
      change,
      this.getTxFee(),
      avaxAssetID,
      memo,
      asOf,
      locktime,
      toThreshold,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Helper function which creates an unsigned [[AddSubnetValidatorTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] manually and import the [[AddSubnetValidatorTx]] class directly.
   *
   * @param utxoset A set of UTXOs that the transaction is built on.
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in AVAX
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param weight The amount of weight for this subnet validator.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param subnetAuth Optional. An Auth struct which contains the subnet Auth and the signers.
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */

  buildAddSubnetValidatorTx = async (
    utxoset: UTXOSet,
    fromAddresses: FromType,
    changeAddresses: string[],
    nodeID: string,
    startTime: BN,
    endTime: BN,
    weight: BN,
    subnetID: string,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    subnetAuth: Auth = { addresses: [], threshold: 0, signer: [] },
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildAddSubnetValidatorTx"

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new Error(
        "PlatformVMAPI.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildAddSubnetValidatorTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID),
      fromSigner,
      change,
      NodeIDStringToBuffer(nodeID),
      startTime,
      endTime,
      weight,
      subnetID,
      this.getDefaultTxFee(),
      avaxAssetID,
      memo,
      asOf,
      subnetAuth,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new Error("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Helper function which creates an unsigned [[AddDelegatorTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] manually and import the [[AddDelegatorTx]] class directly.
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AVAX
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
   * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
   * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
   * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildAddDelegatorTx = async (
    utxoset: UTXOSet,
    toAddresses: string[],
    fromAddresses: FromType,
    changeAddresses: string[],
    nodeID: string,
    startTime: BN,
    endTime: BN,
    stakeAmount: BN,
    rewardAddresses: string[],
    rewardLocktime: BN = ZeroBN,
    rewardThreshold: number = 1,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildAddDelegatorTx"
    const to: Buffer[] = this._cleanAddressArrayBuffer(toAddresses, caller)

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )
    const rewards: Buffer[] = this._cleanAddressArrayBuffer(
      rewardAddresses,
      caller
    )

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const minStake: BN = (await this.getMinStake())["minDelegatorStake"]
    if (stakeAmount.lt(minStake)) {
      throw new StakeError(
        "PlatformVMAPI.buildAddDelegatorTx -- stake amount must be at least " +
          minStake.toString(10)
      )
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "PlatformVMAPI.buildAddDelegatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    if (this.core.getNetwork().P.lockModeBondDeposit) {
      throw new UTXOError(
        "PlatformVMAPI.buildAddDelegatorTx -- not supported in lockmodeBondDeposit"
      )
    }

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildAddDelegatorTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID),
      avaxAssetID,
      to,
      fromSigner,
      change,
      NodeIDStringToBuffer(nodeID),
      startTime,
      endTime,
      stakeAmount,
      rewardLocktime,
      rewardThreshold,
      rewards,
      ZeroBN,
      avaxAssetID,
      memo,
      asOf,
      toThreshold,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Helper function which creates an unsigned [[AddValidatorTx]]. For more granular control, you may create your own
   * [[UnsignedTx]] manually and import the [[AddValidatorTx]] class directly.
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
   * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AVAX
   * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
   * @param nodeID The node ID of the validator being added.
   * @param startTime The Unix time when the validator starts validating the Primary Network.
   * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
   * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
   * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
   * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
   * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
   * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param toThreshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildAddValidatorTx = async (
    utxoset: UTXOSet,
    toAddresses: string[],
    fromAddresses: FromType,
    changeAddresses: string[],
    nodeID: string,
    startTime: BN,
    endTime: BN,
    stakeAmount: BN,
    rewardAddresses: string[],
    delegationFee: number,
    rewardLocktime: BN = ZeroBN,
    rewardThreshold: number = 1,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    toThreshold: number = 1,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildAddValidatorTx"

    const to: Buffer[] = this._cleanAddressArrayBuffer(toAddresses, caller)

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )
    const rewards: Buffer[] = this._cleanAddressArrayBuffer(
      rewardAddresses,
      caller
    )

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const minStake: BN = (await this.getMinStake())["minValidatorStake"]
    if (stakeAmount.lt(minStake)) {
      throw new StakeError(
        "PlatformVMAPI.buildAddValidatorTx -- stake amount must be at least " +
          minStake.toString(10)
      )
    }

    if (
      typeof delegationFee !== "number" ||
      delegationFee > 100 ||
      delegationFee < 0
    ) {
      throw new DelegationFeeError(
        "PlatformVMAPI.buildAddValidatorTx -- delegationFee must be a number between 0 and 100"
      )
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()

    const now: BN = UnixNow()
    if (startTime.lt(now) || endTime.lte(startTime)) {
      throw new TimeError(
        "PlatformVMAPI.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime"
      )
    }

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildAddValidatorTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID),
      to,
      fromSigner,
      change,
      NodeIDStringToBuffer(nodeID),
      startTime,
      endTime,
      stakeAmount,
      avaxAssetID,
      rewardLocktime,
      rewardThreshold,
      rewards,
      delegationFee,
      ZeroBN,
      avaxAssetID,
      memo,
      asOf,
      toThreshold,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Class representing an unsigned [[CreateSubnetTx]] transaction.
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param subnetOwnerAddresses An array of addresses for owners of the new subnet
   * @param subnetOwnerThreshold A number indicating the amount of signatures required to add validators to a subnet
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildCreateSubnetTx = async (
    utxoset: UTXOSet,
    fromAddresses: FromType,
    changeAddresses: string[],
    subnetOwnerAddresses: string[],
    subnetOwnerThreshold: number,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildCreateSubnetTx"

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )
    const owners: Buffer[] = this._cleanAddressArrayBuffer(
      subnetOwnerAddresses,
      caller
    )

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getCreateSubnetTxFee()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildCreateSubnetTx(
      networkID,
      blockchainID,
      fromSigner,
      change,
      owners,
      subnetOwnerThreshold,
      fee,
      avaxAssetID,
      memo,
      asOf,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Build an unsigned [[CreateChainTx]].
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param subnetID Optional ID of the Subnet that validates this blockchain
   * @param chainName Optional A human readable name for the chain; need not be unique
   * @param vmID Optional ID of the VM running on the new chain
   * @param fxIDs Optional IDs of the feature extensions running on the new chain
   * @param genesisData Optional Byte representation of genesis state of the new chain
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param subnetAuth Optional. An Auth struct which contains the subnet Auth and the signers.
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildCreateChainTx = async (
    utxoset: UTXOSet,
    fromAddresses: FromType,
    changeAddresses: string[],
    subnetID: string | Buffer = undefined,
    chainName: string = undefined,
    vmID: string = undefined,
    fxIDs: string[] = undefined,
    genesisData: string | GenesisData = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    subnetAuth: Auth = { addresses: [], threshold: 0, signer: [] },
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildCreateChainTx"

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    fxIDs = fxIDs.sort()

    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getCreateChainTxFee()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildCreateChainTx(
      networkID,
      blockchainID,
      fromSigner,
      change,
      subnetID,
      chainName,
      vmID,
      fxIDs,
      genesisData,
      fee,
      avaxAssetID,
      memo,
      asOf,
      subnetAuth,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }
  /**
   * Build an unsigned [[AddressStateTx]].
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param address The address to alter state.
   * @param state The state to set or remove on the given address
   * @param remove Optional. Flag if state should be applied or removed
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned AddressStateTx created from the passed in parameters.
   */
  buildAddressStateTx = async (
    utxoset: UTXOSet,
    fromAddresses: FromType,
    changeAddresses: string[],
    address: string | Buffer,
    state: number,
    remove: boolean = false,
    memo: Buffer = undefined,
    asOf: BN = ZeroBN,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildAddressStateTx"

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )
    const addressBuf =
      typeof address === "string" ? this.parseAddress(address) : address
    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getTxFee()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildAddressStateTx(
      networkID,
      blockchainID,
      fromSigner,
      change,
      addressBuf,
      state,
      remove,
      fee,
      avaxAssetID,
      memo,
      asOf,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Build an unsigned [[RegisterNodeTx]].
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param oldNodeID Optional. ID of the existing NodeID to replace or remove.
   * @param newNodeID Optional. ID of the newNodID to register address.
   * @param address The consortiumMemberAddress, single or multi-sig.
   * @param addressAuths An array of index and address to verify ownership of address.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildRegisterNodeTx = async (
    utxoset: UTXOSet,
    fromAddresses: FromType,
    changeAddresses: string[] = undefined,
    oldNodeID: string | Buffer = undefined,
    newNodeID: string | Buffer = undefined,
    address: string | Buffer = undefined,
    addressAuths: [number, string | Buffer][] = [],
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildRegisterNodeTx"

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )
    const addrBuf =
      typeof address === "string" ? this.parseAddress(address) : address

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }
    const auth: [number, Buffer][] = []
    addressAuths.forEach((c) => {
      auth.push([
        c[0],
        typeof c[1] === "string" ? this.parseAddress(c[1]) : c[1]
      ])
    })

    if (typeof oldNodeID === "string") {
      oldNodeID = NodeIDStringToBuffer(oldNodeID)
    }

    if (typeof newNodeID === "string") {
      newNodeID = NodeIDStringToBuffer(newNodeID)
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getTxFee()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildRegisterNodeTx(
      networkID,
      blockchainID,
      fromSigner,
      change,
      oldNodeID,
      newNodeID,
      addrBuf,
      auth,
      fee,
      avaxAssetID,
      memo,
      asOf,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Build an unsigned [[DepositTx]].
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param depositOfferID ID of the deposit offer.
   * @param depositDuration Duration of the deposit
   * @param rewardsOwner Optional The owners of the reward. If omitted, all inputs must have the same owner
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildDepositTx = async (
    utxoset: UTXOSet,
    fromAddresses: FromType,
    changeAddresses: string[] = undefined,
    depositOfferID: string | Buffer,
    depositDuration: number | Buffer,
    rewardsOwner: OutputOwners = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    amountToLock: BN,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildRegisterNodeTx"

    const fromSigner = this._parseFromSigner(fromAddresses, caller)

    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getTxFee()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildDepositTx(
      networkID,
      blockchainID,
      fromSigner,
      change,
      depositOfferID,
      depositDuration,
      rewardsOwner,
      fee,
      avaxAssetID,
      memo,
      asOf,
      amountToLock,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Build an unsigned [[UnlockDepositTx]].
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildUnlockDepositTx = async (
    utxoset: UTXOSet,
    fromAddresses: string[],
    changeAddresses: string[] = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    amountToLock: BN,
    changeThreshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller = "buildUnlockDepositTx"
    const fromSigner = this._parseFromSigner(fromAddresses, caller)
    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )
    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getTxFee()

    const builtUnsignedTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildUnlockDepositTx(
      networkID,
      blockchainID,
      fromSigner,
      change,
      fee,
      avaxAssetID,
      memo,
      asOf,
      changeThreshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return builtUnsignedTx
  }

  /**
   * Build an unsigned [[ClaimTx]].
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
   * @param memo Optional contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param changeThreshold Optional. The number of signatures required to spend the funds in the resultant change UTXO
   * @param depositTxs The deposit transactions with which the claiblable rewards are associated
   * @param claimableOwnerIDs The ownerIDs of the rewards to claim
   * @param claimedAmounts The amounts of the rewards to claim
   * @param claimTo The address to claimed rewards will be directed to
   * @param claimableSigners The signers of the claimable rewards
   *
   * @returns An unsigned transaction created from the passed in parameters.
   */
  buildClaimTx = async (
    utxoset: UTXOSet,
    fromAddresses: string[],
    changeAddresses: string[] = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = ZeroBN,
    changeThreshold: number = 1,
    depositTxs: string[] | Buffer[],
    claimableOwnerIDs: string[] | Buffer[],
    claimedAmounts: BN[],
    claimTo: OutputOwners,
    claimableSigners: [number, Buffer][] = []
  ): Promise<UnsignedTx> => {
    const caller = "buildClaimTx"
    const fromSigner = this._parseFromSigner(fromAddresses, caller)
    const change: Buffer[] = this._cleanAddressArrayBuffer(
      changeAddresses,
      caller
    )
    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getTxFee()

    const unsignedClaimTx: UnsignedTx = await this._getBuilder(
      utxoset
    ).buildClaimTx(
      networkID,
      blockchainID,
      fromSigner,
      change,
      fee,
      avaxAssetID,
      memo,
      asOf,
      changeThreshold,
      depositTxs,
      claimableOwnerIDs,
      claimedAmounts,
      claimTo,
      claimableSigners
    )

    if (!(await this.checkGooseEgg(unsignedClaimTx, this.getCreationTxFee()))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError("Failed Goose Egg Check")
    }

    return unsignedClaimTx
  }

  /**
   * @ignore
   */
  protected _cleanAddressArray(
    addresses: string[] | Buffer[],
    caller: string
  ): string[] {
    const addrs: string[] = []
    const chainid: string = this.getBlockchainAlias()
      ? this.getBlockchainAlias()
      : this.getBlockchainID()
    if (addresses && addresses.length > 0) {
      for (let i: number = 0; i < addresses.length; i++) {
        if (typeof addresses[`${i}`] === "string") {
          if (
            typeof this.parseAddress(addresses[`${i}`] as string) ===
            "undefined"
          ) {
            /* istanbul ignore next */
            throw new AddressError(`Error - Invalid address format (${caller})`)
          }
          addrs.push(addresses[`${i}`] as string)
        } else {
          const bech32: SerializedType = "bech32"
          addrs.push(
            serialization.bufferToType(
              addresses[`${i}`] as Buffer,
              bech32,
              this.core.getHRP(),
              chainid
            )
          )
        }
      }
    }
    return addrs
  }

  protected _cleanAddressArrayBuffer(
    addresses: string[] | Buffer[],
    caller: string
  ): Buffer[] {
    return this._cleanAddressArray(addresses, caller).map(
      (a: string): Buffer => {
        return typeof a === "undefined"
          ? undefined
          : bintools.stringToAddress(a)
      }
    )
  }

  protected _parseFromSigner(from: FromType, caller: string): FromSigner {
    if (from.length > 0) {
      if (typeof from[0] === "string")
        return {
          from: this._cleanAddressArrayBuffer(from as string[], caller),
          signer: []
        }
      else
        return {
          from: this._cleanAddressArrayBuffer(from[0] as string[], caller),
          signer:
            from.length > 1
              ? this._cleanAddressArrayBuffer(from[1] as string[], caller)
              : []
        }
    }
    return { from: [], signer: [] }
  }

  /**
   * This class should not be instantiated directly.
   * Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/P" as the path to blockchain's baseURL
   */
  constructor(core: AvalancheCore, baseURL: string = "/ext/bc/P") {
    super(core, baseURL)
    if (core.getNetwork()) {
      this.blockchainID = core.getNetwork().P.blockchainID
      this.keychain = new KeyChain(core.getHRP(), core.getNetwork().P.alias)
    }
  }

  /**
   * @returns the current timestamp on chain.
   */
  getTimestamp = async (): Promise<number> => {
    const response: RequestResponseData = await this.callMethod(
      "platform.getTimestamp"
    )
    return response.data.result.timestamp
  }

  /**
   * @returns the UTXOs that were rewarded after the provided transaction"s staking or delegation period ended.
   */
  getRewardUTXOs = async (
    txID: string,
    encoding?: string
  ): Promise<GetRewardUTXOsResponse> => {
    const params: GetRewardUTXOsParams = {
      txID,
      encoding
    }
    const response: RequestResponseData = await this.callMethod(
      "platform.getRewardUTXOs",
      params
    )
    return response.data.result
  }

  /**
   * Get blockchains configuration (genesis)
   *
   * @returns Promise for an GetConfigurationResponse
   */
  getConfiguration = async (): Promise<GetConfigurationResponse> => {
    const response: RequestResponseData = await this.callMethod(
      "platform.getConfiguration"
    )
    const r = response.data.result
    return {
      networkID: parseInt(r.networkID),
      assetID: r.assetID,
      assetSymbol: r.assetSymbol,
      hrp: r.hrp,
      blockchains: r.blockchains,
      minStakeDuration: new BN(r.minStakeDuration).div(NanoBN).toNumber(),
      maxStakeDuration: new BN(r.maxStakeDuration).div(NanoBN).toNumber(),
      minValidatorStake: new BN(r.minValidatorStake),
      maxValidatorStake: new BN(r.maxValidatorStake),
      minDelegationFee: new BN(r.minDelegationFee),
      minDelegatorStake: new BN(r.minDelegatorStake),
      minConsumptionRate: parseInt(r.minConsumptionRate) / rewardPercentDenom,
      maxConsumptionRate: parseInt(r.maxConsumptionRate) / rewardPercentDenom,
      supplyCap: new BN(r.supplyCap),
      verifyNodeSignature: r.verifyNodeSignature ?? false,
      lockModeBondDeposit: r.lockModeBondDeposit ?? false
    } as GetConfigurationResponse
  }

  /**
   * Get blockchains configuration (genesis)
   *
   * @returns Promise for an GetConfigurationResponse
   */
  spend = async (
    from: string[] | string,
    signer: string[] | string,
    to: string[],
    toThreshold: number,
    toLockTime: BN,
    change: string[],
    changeThreshold: number,
    lockMode: LockMode,
    amountToLock: BN,
    amountToBurn: BN,
    asOf: BN,
    encoding?: string
  ): Promise<SpendReply> => {
    if (!["Unlocked", "Deposit", "Bond"].includes(lockMode)) {
      throw new ProtocolError("Error -- PlatformAPI.spend: invalid lockMode")
    }
    const params: SpendParams = {
      from,
      signer,
      to:
        to.length > 0
          ? {
              locktime: toLockTime.toString(10),
              threshold: toThreshold,
              addresses: to
            }
          : undefined,
      change:
        change.length > 0
          ? { locktime: "0", threshold: changeThreshold, addresses: change }
          : undefined,
      lockMode: lockMode === "Unlocked" ? 0 : lockMode === "Deposit" ? 1 : 2,
      amountToLock: amountToLock.toString(10),
      amountToBurn: amountToBurn.toString(10),
      asOf: asOf.toString(10),
      encoding: encoding ?? "hex"
    }

    const response: RequestResponseData = await this.callMethod(
      "platform.spend",
      params
    )
    const r = response.data.result

    // We need to update signature index source here
    const ins = TransferableInput.fromArray(Buffer.from(r.ins.slice(2), "hex"))
    ins.forEach((e, idx) =>
      e.getSigIdxs().forEach((s, sidx) => {
        s.setSource(bintools.cb58Decode(r.signers[`${idx}`][`${sidx}`]))
      })
    )

    return {
      ins,
      out: TransferableOutput.fromArray(Buffer.from(r.outs.slice(2), "hex")),
      owners: r.owners
        ? OutputOwners.fromArray(Buffer.from(r.owners.slice(2), "hex"))
        : []
    }
  }

  _getBuilder = (utxoSet: UTXOSet): Builder => {
    if (this.core.getNetwork().P.lockModeBondDeposit) {
      return new Builder(new Spender(this), true)
    }
    return new Builder(utxoSet, false)
  }
}
