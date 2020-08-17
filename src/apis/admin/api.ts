/**
 * @packageDocumentation
 * @module API-Admin
 */
import AvalancheCore from '../../avalanche';
import { JRPCAPI } from '../../common/jrpcapi';
import { RequestResponseData } from '../../common/apibase';


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
     * work. This change only affects this node; other nodes will not know about this alias.
     *
     * @param endpoint The original endpoint of the API. endpoint should only include the part of
     * the endpoint after /ext/
     * @param alias The API being aliased can now be called at ext/alias
     *
     * @returns Returns a Promise<boolean> containing success, true for success, false for failure.
     */
  alias = async (endpoint:string, alias:string):Promise<boolean> => {
    const params:any = {
      endpoint,
      alias,
    };
    return this.callMethod('admin.alias', params)
      .then((response:RequestResponseData) => response.data.result.success);
  };

  /**
     * Give a blockchain an alias, a different name that can be used any place the blockchain’s
     * ID is used.
     *
     * @param endpoint The blockchain’s ID
     * @param alias Can now be used in place of the blockchain’s ID (in API endpoints, for example)
     *
     * @returns Returns a Promise<boolean> containing success, true for success, false for failure.
     */
  aliasChain = async (chain:string, alias:string):Promise<boolean> => {
    const params:any = {
      chain,
      alias,
    };
    return this.callMethod('admin.aliasChain', params)
      .then((response:RequestResponseData) => response.data.result.success);
  };

  /**
     * Dump the mutex statistics of the node to the specified file.
     *
     * @returns Promise for a boolean that is true on success.
     */
  lockProfile = async ():Promise<boolean> => {
    const params:any = {};
    return this.callMethod('admin.lockProfile', params)
      .then((response:RequestResponseData) => response.data.result.success);
  };

  /**
     * Dump the current memory footprint of the node to the specified file.
     *
     * @returns Promise for a boolean that is true on success.
     */
  memoryProfile = async ():Promise<boolean> => {
    const params:any = {};
    return this.callMethod('admin.memoryProfile', params)
      .then((response:RequestResponseData) => response.data.result.success);
  };

  /**
     * Start profiling the cpu utilization of the node. Will dump the profile information into
     * the specified file on stop.
     *
     * @returns Promise for a boolean that is true on success.
     */
  startCPUProfiler = async ():Promise<boolean> => {
    const params:any = {};
    return this.callMethod('admin.startCPUProfiler', params)
      .then((response:RequestResponseData) => response.data.result.success);
  };

  /**
     * Stop the CPU profile that was previously started.
     *
     * @returns Promise for a boolean that is true on success.
     */
  stopCPUProfiler = async ():Promise<boolean> => this.callMethod('admin.stopCPUProfiler')
    .then((response:RequestResponseData) => response.data.result.success);

  /**
     * This class should not be instantiated directly. Instead use the [[Avalanche.addAPI]]
     * method.
     *
     * @param core A reference to the Avalanche class
     * @param baseurl Defaults to the string "/ext/admin" as the path to rpc's baseurl
     */
  constructor(core:AvalancheCore, baseurl:string = '/ext/admin') { super(core, baseurl); }
}
