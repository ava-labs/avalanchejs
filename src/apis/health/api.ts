/**
 * @module HealthAPI
 */
import SlopesCore from '../../slopes';
import {JRPCAPI, RequestResponseData} from "../../utils/types"

/**
 * Class for interacting with a node API that is using the node's HealthApi.
 *
 * @category RPCAPIs
 * 
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Slopes.addAPI]] function to register this interface with Slopes.
 */ 
class HealthAPI extends JRPCAPI{

    /**
     *
     * @returns Promise for an object containing the health check response
     */
    getLiveness = async ():Promise<object> => {
        return this.callMethod("health.getLiveness").then((response:RequestResponseData) => {
            return response.data["result"];
        });
    }

    /**
     * This class should not be instantiated directly. Instead use the [[Slopes.addAPI]] method.
     * 
     * @param core A reference to the Slopes class
     * @param baseurl Defaults to the string "/ext/health" as the path to blockchain's baseurl
     */
    constructor(core:SlopesCore, baseurl:string = "/ext/health"){ super(core, baseurl); }
}

export default HealthAPI;