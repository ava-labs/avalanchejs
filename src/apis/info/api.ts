/**
 * @packageDocumentation
 * @module API-Info
 */
import AvalancheCore from '../../avalanche';
import { JRPCAPI } from '../../common/jrpcapi';
import { RequestResponseData } from '../../common/apibase';
import BN from "bn.js";

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
   * @returns Returns a Promise<string> containing the base 58 string representation of the blockchainID.
   */
  getBlockchainID = async (alias:string):Promise<string> => {
    const params:any = {
      alias,
    };
    return this.callMethod('info.getBlockchainID', params)
      .then((response:RequestResponseData) => response.data.result.blockchainID);
  };

  /**
   * Fetches the networkID from the node.
   *
   * @returns Returns a Promise<number> of the networkID.
   */
  getNetworkID = async ():Promise<number> => {
    const params:any = {};
    return this.callMethod('info.getNetworkID', params)
      .then((response:RequestResponseData) => response.data.result.networkID);
  };

  /**
   * Fetches the network name this node is running on
   *
   * @returns Returns a Promise<string> containing the network name.
   */
  getNetworkName = async ():Promise<string> => this.callMethod('info.getNetworkName')
    .then((response:RequestResponseData) => response.data.result.networkName);

  /**
   * Fetches the nodeID from the node.
   *
   * @returns Returns a Promise<string> of the nodeID.
   */
  getNodeID = async ():Promise<string> => {
    const params:any = {};
    return this.callMethod('info.getNodeID', params)
      .then((response:RequestResponseData) => response.data.result.nodeID);
  };

  /**
   * Fetches the version of Gecko this node is running
   *
   * @returns Returns a Promise<string> containing the version of Gecko.
   */
  getNodeVersion = async ():Promise<string> => this.callMethod('info.getNodeVersion')
    .then((response:RequestResponseData) => response.data.result.version);

  /**
   * Fetches the transaction fee from the node.
   *
   * @returns Returns a Promise<object> of the transaction fee in nAVAX.
   */
  getTxFee = async ():Promise<{txFee:BN, creationTxFee:BN}> => {
    return this.callMethod('info.getTxFee')
        .then((response:RequestResponseData) => {
          return {
            txFee: new BN(response.data.result.txFee, 10),
            creationTxFee: new BN(response.data.result.creationTxFee, 10)
          }
        });
  };

  /**
   * Check whether a given chain is done bootstrapping
   * @param chain The ID or alias of a chain.
   *
   * @returns Returns a Promise<boolean> of whether the chain has completed bootstrapping.
   */
  isBootstrapped = async (chain:string):Promise<boolean> => {
    const params:any = {
      chain
    };
    return this.callMethod('info.isBootstrapped', params)
        .then((response:RequestResponseData) => response.data.result.isBootstrapped);
  };

  /**
   * Returns the peers connected to the node.
   *
   * @returns Promise for the list of connected peers in <ip>:<port> format.
   */
  peers = async ():Promise<Array<string>> => this.callMethod('info.peers')
    .then((response:RequestResponseData) => response.data.result.peers);

  constructor(core:AvalancheCore, baseurl:string = '/ext/info') { super(core, baseurl); }
}
