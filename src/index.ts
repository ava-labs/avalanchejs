/**
 * @packageDocumentation
 * @module Avalanche
 */
import AvalancheCore from "./camino"
import { AdminAPI } from "./apis/admin/api"
import { AuthAPI } from "./apis/auth/api"
import { AVMAPI } from "./apis/avm/api"
import { EVMAPI } from "./apis/evm/api"
import { GenesisAsset } from "./apis/avm/genesisasset"
import { GenesisData } from "./apis/avm/genesisdata"
import { HealthAPI } from "./apis/health/api"
import { IndexAPI } from "./apis/index/api"
import { InfoAPI } from "./apis/info/api"
import { KeystoreAPI } from "./apis/keystore/api"
import { MetricsAPI } from "./apis/metrics/api"
import { PlatformVMAPI } from "./apis/platformvm/api"
import { Socket } from "./apis/socket/socket"
import BinTools from "./utils/bintools"
import DB from "./utils/db"
import Mnemonic from "./utils/mnemonic"
import PubSub from "./utils/pubsub"
import HDNode from "./utils/hdnode"
import BN from "bn.js"
import { Buffer } from "buffer/"
import networks from "./utils/networks"
import {
  CChainAlias,
  CChainVMName,
  GWEI,
  MILLIAVAX,
  PChainAlias,
  PChainVMName,
  XChainAlias,
  XChainVMName
} from "./utils/constants"
import { DefaultPlatformChainID } from "./utils"
import { GetConfigurationResponse } from "./apis/platformvm/interfaces"

/**
 * AvalancheJS is middleware for interacting with Avalanche node RPC APIs.
 *
 * Example usage:
 * ```js
 * const avalanche: Avalanche = new Avalanche("127.0.0.1", 9650, "https")
 * ```
 *
 */
export default class Avalanche extends AvalancheCore {
  /**
   * Returns a reference to the Admin RPC.
   */
  Admin = () => this.apis.admin as AdminAPI

  /**
   * Returns a reference to the Auth RPC.
   */
  Auth = () => this.apis.auth as AuthAPI

  /**
   * Returns a reference to the EVMAPI RPC pointed at the C-Chain.
   */
  CChain = () => this.apis.cchain as EVMAPI

  /**
   * Returns a reference to the AVM RPC pointed at the X-Chain.
   */
  XChain = () => this.apis.xchain as AVMAPI

  /**
   * Returns a reference to the Health RPC for a node.
   */
  Health = () => this.apis.health as HealthAPI

  /**
   * Returns a reference to the Index RPC for a node.
   */
  Index = () => this.apis.index as IndexAPI

  /**
   * Returns a reference to the Info RPC for a node.
   */
  Info = () => this.apis.info as InfoAPI

  /**
   * Returns a reference to the Metrics RPC.
   */
  Metrics = () => this.apis.metrics as MetricsAPI

  /**
   * Returns a reference to the Keystore RPC for a node. We label it "NodeKeys" to reduce
   * confusion about what it's accessing.
   */
  NodeKeys = () => this.apis.keystore as KeystoreAPI

  /**
   * Returns a reference to the PlatformVM RPC pointed at the P-Chain.
   */
  PChain = () => this.apis.pchain as PlatformVMAPI

  /**
   * Creates a new Avalanche instance. Sets the address and port of the main Avalanche Client.
   *
   * @param host The hostname to resolve to reach the Avalanche Client RPC APIs
   * @param port The port to resolve to reach the Avalanche Client RPC APIs
   * @param protocol The protocol string to use before a "://" in a request,
   * ex: "http", "https", "git", "ws", etc. Defaults to http
   * @param networkID Sets the NetworkID of the class. Default [[DefaultNetworkID]]
   * @param XChainID Sets the blockchainID for the AVM. Will try to auto-detect,
   * otherwise default "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
   * @param CChainID Sets the blockchainID for the EVM. Will try to auto-detect,
   * otherwise default "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"
   * @param hrp The human-readable part of the bech32 addresses
   * @param skipinit Skips creating the APIs. Defaults to false
   */
  constructor(
    host: string,
    port: number,
    protocol: string,
    networkID: number = undefined,
    XChainID: string = undefined,
    CChainID: string = undefined,
    skipinit: boolean = false
  ) {
    super(host, port, protocol, networkID)
    if (!skipinit) {
      this.addAPI("admin", AdminAPI)
      this.addAPI("auth", AuthAPI)
      this.addAPI("health", HealthAPI)
      this.addAPI("info", InfoAPI)
      this.addAPI("index", IndexAPI)
      this.addAPI("keystore", KeystoreAPI)
      this.addAPI("metrics", MetricsAPI)
    }

    // Static initializing
    if (networkID && (this.network = networks.getNetwork(networkID))) {
      this.networkID = networkID
      if (!skipinit) {
        this.addAPI("pchain", PlatformVMAPI)
        this.addAPI(
          "xchain",
          AVMAPI,
          "/ext/bc/X",
          XChainID ? XChainID : this.network.X.blockchainID
        )
        this.addAPI(
          "cchain",
          EVMAPI,
          "/ext/bc/C/avax",
          CChainID ? CChainID : this.network.C.blockchainID
        )
      }
    }
  }

  fetchNetworkSettings = async (): Promise<boolean> => {
    // Nothing to do if network is known
    if (this.network) return true
    // We need this be able to make next call
    this.addAPI("pchain", PlatformVMAPI)
    //Get platform configuration
    let response: GetConfigurationResponse

    try {
      response = await this.PChain().getConfiguration()
      this.networkID = response.networkID
    } catch (error) {
      this.networkID = await this.Info().getNetworkID()
    }

    if ((this.network = networks.getNetwork(this.networkID)))
      return this.refreshAPI()

    if (!response) {
      throw new Error("Configuration required")
    }

    const xchain = response.blockchains.find((b) => b["name"] === "X-Chain")
    const cchain = response.blockchains.find((b) => b["name"] === "C-Chain")

    const fees = await this.Info().getTxFee()

    this.network = {
      hrp: response.hrp,
      X: {
        alias: XChainAlias,
        avaxAssetID: response.assetID,
        avaxAssetAlias: response.assetSymbol,
        blockchainID: xchain["id"],
        vm: XChainVMName,
        creationTxFee: fees.creationTxFee,
        txFee: fees.txFee
      },
      P: {
        alias: PChainAlias,
        blockchainID: DefaultPlatformChainID,
        creationTxFee: fees.creationTxFee,
        createSubnetTx: fees.createSubnetTxFee,
        createChainTx: fees.createBlockchainTxFee,
        maxConsumption: response.maxConsumptionRate,
        maxStakeDuration: response.maxStakeDuration,
        maxStakingDuration: new BN(response.maxStakeDuration),
        maxSupply: response.supplyCap,
        minConsumption: response.minConsumptionRate,
        minDelegationFee: response.minDelegationFee,
        minDelegationStake: response.minDelegatorStake,
        minStake: response.minValidatorStake,
        minStakeDuration: response.minStakeDuration,
        vm: PChainVMName,
        txFee: fees.txFee
      },
      C: {
        alias: CChainAlias,
        blockchainID: cchain["id"],
        chainID: 43112,
        costPerSignature: 1000,
        gasPrice: GWEI.mul(new BN(225)),
        maxGasPrice: GWEI.mul(new BN(1000)),
        minGasPrice: GWEI.mul(new BN(25)),
        txBytesGas: 1,
        txFee: MILLIAVAX,
        vm: CChainVMName
      }
    }

    networks.registerNetwork(this.networkID, this.network)

    return this.refreshAPI()
  }

  protected refreshAPI = (): boolean => {
    // Re-apply pchain which creates the correct keychain
    this.addAPI("pchain", PlatformVMAPI)

    // Finally register x and c chains
    this.addAPI("xchain", AVMAPI, "/ext/bc/X", this.network.X.blockchainID)
    this.addAPI("cchain", EVMAPI, "/ext/bc/C/avax", this.network.C.blockchainID)

    return true
  }
}

export { Avalanche }
export { AvalancheCore }
export { BinTools }
export { BN }
export { Buffer }
export { DB }
export { HDNode }
export { GenesisAsset }
export { GenesisData }
export { Mnemonic }
export { PubSub }
export { Socket }

export * as admin from "./apis/admin"
export * as auth from "./apis/auth"
export * as avm from "./apis/avm"
export * as common from "./common"
export * as evm from "./apis/evm"
export * as health from "./apis/health"
export * as index from "./apis/index"
export * as info from "./apis/info"
export * as keystore from "./apis/keystore"
export * as metrics from "./apis/metrics"
export * as platformvm from "./apis/platformvm"
export * as utils from "./utils"
