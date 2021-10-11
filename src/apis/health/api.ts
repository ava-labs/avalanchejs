/**
 * @packageDocumentation
 * @module API-Health
 */
import AvalancheCore from "../../avalanche"
import { JRPCAPI } from "../../common/jrpcapi"
import { RequestResponseData } from "../../common/apibase"
import { HealthResponse } from "./interfaces"

/**
 * Class for interacting with a node API that is using the node's HealthApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class HealthAPI extends JRPCAPI {
  /**
   *
   * @returns Promise for a [[HealthResponse]]
   */
  health = async (): Promise<HealthResponse> => {
    const response: RequestResponseData = await this.callMethod("health.health")
    return response.data.result
  }

  /**
   * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/health" as the path to rpc's baseURL
   */
  constructor(core: AvalancheCore, baseURL: string = "/ext/health") {
    super(core, baseURL)
  }
}
