/**
 * @packageDocumentation
 * @module HealthAPI
 */
import AvalancheCore from '../../avalanche';
import { JRPCAPI, RequestResponseData } from '../../utils/types';

/**
 * Class for interacting with a node API that is using the node's HealthApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
class HealthAPI extends JRPCAPI {
  /**
     *
     * @returns Promise for an object containing the health check response
     */
  getLiveness = async ():Promise<object> => this.callMethod('health.getLiveness')
    .then((response:RequestResponseData) => response.data.result);

  /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
     *
     * @param core A reference to the Avalanche class
     * @param baseurl Defaults to the string "/ext/health" as the path to blockchain's baseurl
     */
  constructor(core:AvalancheCore, baseurl:string = '/ext/health') { super(core, baseurl); }
}

export default HealthAPI;
