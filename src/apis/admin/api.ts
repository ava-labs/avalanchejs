/**
 * @packageDocumentation
 * @module AdminAPI
 */
import AvalancheCore from '../../avalanche';
import { JRPCAPI, RequestResponseData } from '../../utils/types';

/**
 * Class for interacting with a node's AdminAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called.
 * Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export default class AdminAPI extends JRPCAPI {
  /**
     * Fetches the nodeID from the node.
     *
     * @returns Returns a Promise<string> of the nodeID.
     */
  getNodeID = async ():Promise<string> => {
    const params:any = {};
    return this.callMethod('admin.getNodeID', params)
      .then((response:RequestResponseData) => response.data.result.nodeID);
  };

  /**
     * Fetches the networkID from the node.
     *
     * @returns Returns a Promise<number> of the networkID.
     */
  getNetworkID = async ():Promise<number> => {
    const params:any = {};
    return this.callMethod('admin.getNetworkID', params)
      .then((response:RequestResponseData) => response.data.result.networkID);
  };

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
     * Fetches the blockchainID from the node for a given alias.
     *
     * @param alias The blockchain alias to get the blockchainID
     *
     * @returns Returns a Promise<string> containing the base 58 string representation of the
     * blockchainID.
     */
  getBlockchainID = async (alias:string):Promise<string> => {
    const params:any = {
      alias,
    };
    return this.callMethod('admin.getBlockchainID', params)
      .then((response:RequestResponseData) => response.data.result.blockchainID);
  };

  /**
     * Fetches the version of Gecko this node is running
     *
     * @returns Returns a Promise<string> containing the version of Gecko.
     */
  getNodeVersion = async ():Promise<string> => this.callMethod('admin.getNodeVersion')
    .then((response:RequestResponseData) => response.data.result.version);

  /**
     * Fetches the network name this node is running on
     *
     * @returns Returns a Promise<string> containing the network name.
     */
  getNetworkName = async ():Promise<string> => this.callMethod('admin.getNetworkName')
    .then((response:RequestResponseData) => response.data.result.networkName);

  /**
     * Dump the mutex statistics of the node to the specified file.
     *
     * @param filename Name of the file to write the statistics.
     *
     * @returns Promise for a boolean that is true on success.
     */
  lockProfile = async (filename:string):Promise<boolean> => {
    const params:any = {
      fileName: filename,
    };
    return this.callMethod('admin.lockProfile', params)
      .then((response:RequestResponseData) => response.data.result.success);
  };

  /**
     * Dump the current memory footprint of the node to the specified file.
     *
     * @param filename Name of the file to write the profile information.
     *
     * @returns Promise for a boolean that is true on success.
     */
  memoryProfile = async (filename:string):Promise<boolean> => {
    const params:any = {
      fileName: filename,
    };
    return this.callMethod('admin.memoryProfile', params)
      .then((response:RequestResponseData) => response.data.result.success);
  };

  /**
     * Returns the peers connected to the node.
     *
     * @returns Promise for the list of connected peers in <ip>:<port> format.
     */
  peers = async ():Promise<Array<string>> => this.callMethod('admin.peers')
    .then((response:RequestResponseData) => response.data.result.peers);

  /**
     * Start profiling the cpu utilization of the node. Will dump the profile information into
     * the specified file on stop.
     *
     * @param filename Name of the file to write the profile information on stop.
     *
     * @returns Promise for a boolean that is true on success.
     */
  startCPUProfiler = async (filename:string):Promise<boolean> => {
    const params:any = {
      fileName: filename,
    };
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
