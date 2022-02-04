/**
 * @packageDocumentation
 * @module API-Info
 */
import AvalancheCore from "../../avalanche"
import { JRPCAPI } from "../../common/jrpcapi"
import { RequestResponseData } from "../../common/apibase"
import BN from "bn.js"
import {
  GetBlockchainIDParams,
  GetTxFeeResponse,
  IsBootstrappedParams,
  PeersParams,
  PeersResponse,
  UptimeResponse
} from "./interfaces"

/**
 * Class for interacting with a node's InfoAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class InfoAPI extends JRPCAPI {
  /**
   * Fetches the blockchainID from the node for a given alias.
   *
   * @param alias The blockchain alias to get the blockchainID
   *
   * @returns Returns a Promise string containing the base 58 string representation of the blockchainID.
   */
  getBlockchainID = async (alias: string): Promise<string> => {
    const params: GetBlockchainIDParams = {
      alias
    }

    const response: RequestResponseData = await this.callMethod(
      "info.getBlockchainID",
      params
    )
    return response.data.result.blockchainID
  }

  /**
   * Fetches the IP address from the node.
   *
   * @returns Returns a Promise string of the node IP address.
   */
  getNodeIP = async (): Promise<string> => {
    const response: RequestResponseData = await this.callMethod(
      "info.getBlockchainID"
    )
    return response.data.result.ip
  }

  /**
   * Fetches the networkID from the node.
   *
   * @returns Returns a Promise number of the networkID.
   */
  getNetworkID = async (): Promise<number> => {
    const response: RequestResponseData = await this.callMethod(
      "info.getNetworkID"
    )
    return response.data.result.networkID
  }

  /**
   * Fetches the network name this node is running on
   *
   * @returns Returns a Promise string containing the network name.
   */
  getNetworkName = async (): Promise<string> => {
    const response: RequestResponseData = await this.callMethod(
      "info.getNetworkName"
    )
    return response.data.result.networkName
  }

  /**
   * Fetches the nodeID from the node.
   *
   * @returns Returns a Promise string of the nodeID.
   */
  getNodeID = async (): Promise<string> => {
    const response: RequestResponseData = await this.callMethod(
      "info.getNodeID"
    )
    return response.data.result.nodeID
  }

  /**
   * Fetches the version of Gecko this node is running
   *
   * @returns Returns a Promise string containing the version of Gecko.
   */
  getNodeVersion = async (): Promise<string> => {
    const response: RequestResponseData = await this.callMethod(
      "info.getNodeVersion"
    )
    return response.data.result.version
  }

  /**
   * Fetches the transaction fee from the node.
   *
   * @returns Returns a Promise object of the transaction fee in nAVAX.
   */
  getTxFee = async (): Promise<GetTxFeeResponse> => {
    const response: RequestResponseData = await this.callMethod("info.getTxFee")
    return {
      txFee: new BN(response.data.result.txFee, 10),
      creationTxFee: new BN(response.data.result.creationTxFee, 10)
    }
  }

  /**
   * Check whether a given chain is done bootstrapping
   * @param chain The ID or alias of a chain.
   *
   * @returns Returns a Promise boolean of whether the chain has completed bootstrapping.
   */
  isBootstrapped = async (chain: string): Promise<boolean> => {
    const params: IsBootstrappedParams = {
      chain
    }
    const response: RequestResponseData = await this.callMethod(
      "info.isBootstrapped",
      params
    )
    return response.data.result.isBootstrapped
  }

  /**
   * Returns the peers connected to the node.
   * @param nodeIDs an optional parameter to specify what nodeID's descriptions should be returned.
   * If this parameter is left empty, descriptions for all active connections will be returned.
   * If the node is not connected to a specified nodeID, it will be omitted from the response.
   *
   * @returns Promise for the list of connected peers in PeersResponse format.
   */
  peers = async (nodeIDs: string[] = []): Promise<PeersResponse[]> => {
    const params: PeersParams = {
      nodeIDs
    }
    const response: RequestResponseData = await this.callMethod(
      "info.peers",
      params
    )
    return response.data.result.peers
  }

  /**
   * Returns the network's observed uptime of this node.
   *
   * @returns Returns a Promise UptimeResponse which contains rewardingStakePercentage and weightedAveragePercentage.
   */
  uptime = async (): Promise<UptimeResponse> => {
    const response: RequestResponseData = await this.callMethod("info.uptime")
    return response.data.result
  }

  /**
   * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/info" as the path to rpc's baseURL
   */
  constructor(core: AvalancheCore, baseURL: string = "/ext/info") {
    super(core, baseURL)
  }
}
