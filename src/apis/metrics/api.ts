/**
 * @packageDocumentation
 * @module API-Metrics
 */
import AvalancheCore from "../../avalanche"
import { RESTAPI } from "../../common/restapi"
import { RequestResponseData } from "../../common/apibase"
import { AxiosRequestConfig } from "axios"

/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class MetricsAPI extends RESTAPI {
  protected axConf = (): AxiosRequestConfig => {
    return {
      baseURL: `${this.core.getProtocol()}://${this.core.getHost()}:${this.core.getPort()}`,
      responseType: "text"
    }
  }

  /**
   *
   * @returns Promise for an object containing the metrics response
   */
  getMetrics = async (): Promise<string> => {
    const response: RequestResponseData = await this.post("")
    return response.data as string
  }

  /**
   * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/metrics" as the path to rpc's baseurl
   */
  constructor(core: AvalancheCore, baseURL: string = "/ext/metrics") {
    super(core, baseURL)
  }
}
