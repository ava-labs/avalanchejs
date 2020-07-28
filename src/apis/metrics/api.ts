/**
 * @packageDocumentation
 * @module MetricsAPI
 */
import AvalancheCore from '../../avalanche';
import { RESTAPI, RequestResponseData } from '../../utils/types';

/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class MetricsAPI extends RESTAPI {
  /**
     *
     * @returns Promise for an object containing the metrics response
     */
  getMetrics = async ():Promise<string> => this.post('')
    .then((response:RequestResponseData) => response.data as string);

  /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
     *
     * @param core A reference to the Avalanche class
     * @param baseurl Defaults to the string "/ext/metrics" as the path to blockchain's baseurl
     */
  constructor(core:AvalancheCore, baseurl:string = '/ext/metrics') { super(core, baseurl); }
}

export default MetricsAPI;
