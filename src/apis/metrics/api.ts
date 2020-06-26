/**
 * @packageDocumentation
 * @module MetricsAPI
 */
import AvalancheCore from '../../avalanche';
import {RAWAPI, RequestResponseData} from "../../utils/types"

/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 * 
 * @remarks This extends the [[RAWAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */ 
class MetricsAPI extends RAWAPI{

    /**
     *
     * @returns Promise for an object containing the metrics response
     */
    getMetrics = async ():Promise<string> => {
        return this.callMethod("").then((response:RequestResponseData) => {
            return response.data as string;
        });
    }

    /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]] method.
     * 
     * @param core A reference to the Avalanche class
     * @param baseurl Defaults to the string "/ext/metrics" as the path to blockchain's baseurl
     */
    constructor(core:AvalancheCore, baseurl:string = "/ext/metrics"){ super(core, baseurl); }
}

export default MetricsAPI;