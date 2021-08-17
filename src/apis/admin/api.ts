/**
 * @packageDocumentation
 * @module API-Admin
 */
import AvalancheCore from "../../avalanche"
import { JRPCAPI } from "../../common/jrpcapi"
import { RequestResponseData } from "../../common/apibase"
import {
  AliasChainParams,
  AliasParams,
  GetChainAliasesParams
} from "./interfaces"

/**
 * Class for interacting with a node's AdminAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called.
 * Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */

export class AdminAPI extends JRPCAPI {
  /**
   * Assign an API an alias, a different endpoint for the API. The original endpoint will still
   * work. This change only affects this node other nodes will not know about this alias.
   *
   * @param endpoint The original endpoint of the API. endpoint should only include the part of
   * the endpoint after /ext/
   * @param alias The API being aliased can now be called at ext/alias
   *
   * @returns Returns a Promise<boolean> containing success, true for success, false for failure.
   */
  alias = async (endpoint: string, alias: string): Promise<boolean> => {
    const params: AliasParams = {
      endpoint,
      alias
    }
    const response: RequestResponseData = await this.callMethod(
      "admin.alias",
      params
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * Give a blockchain an alias, a different name that can be used any place the blockchain’s
   * ID is used.
   *
   * @param chain The blockchain’s ID
   * @param alias Can now be used in place of the blockchain’s ID (in API endpoints, for example)
   *
   * @returns Returns a Promise<boolean> containing success, true for success, false for failure.
   */
  aliasChain = async (chain: string, alias: string): Promise<boolean> => {
    const params: AliasChainParams = {
      chain,
      alias
    }
    const response: RequestResponseData = await this.callMethod(
      "admin.aliasChain",
      params
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * Get all aliases for given blockchain
   *
   * @param chain The blockchain’s ID
   *
   * @returns Returns a Promise<string[]> containing aliases of the blockchain.
   */
  getChainAliases = async (chain: string): Promise<string[]> => {
    const params: GetChainAliasesParams = {
      chain
    }
    const response: RequestResponseData = await this.callMethod(
      "admin.getChainAliases",
      params
    )
    return response.data.result.aliases
      ? response.data.result.aliases
      : response.data.result
  }

  /**
   * Dump the mutex statistics of the node to the specified file.
   *
   * @returns Promise for a boolean that is true on success.
   */
  lockProfile = async (): Promise<boolean> => {
    const response: RequestResponseData = await this.callMethod(
      "admin.lockProfile"
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * Dump the current memory footprint of the node to the specified file.
   *
   * @returns Promise for a boolean that is true on success.
   */
  memoryProfile = async (): Promise<boolean> => {
    const response: RequestResponseData = await this.callMethod(
      "admin.memoryProfile"
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * Start profiling the cpu utilization of the node. Will dump the profile information into
   * the specified file on stop.
   *
   * @returns Promise for a boolean that is true on success.
   */
  startCPUProfiler = async (): Promise<boolean> => {
    const response: RequestResponseData = await this.callMethod(
      "admin.startCPUProfiler"
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * Stop the CPU profile that was previously started.
   *
   * @returns Promise for a boolean that is true on success.
   */
  stopCPUProfiler = async (): Promise<boolean> => {
    const response: RequestResponseData = await this.callMethod(
      "admin.stopCPUProfiler"
    )
    return response.data.result.success
      ? response.data.result.success
      : response.data.result
  }

  /**
   * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]]
   * method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/admin" as the path to rpc's baseURL
   */
  constructor(core: AvalancheCore, baseURL: string = "/ext/admin") {
    super(core, baseURL)
  }
}
