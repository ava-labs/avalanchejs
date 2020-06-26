/**
 * @packageDocumentation
 * @module InfoAPI
 */
import AvalancheCore from '../../avalanche';
import {JRPCAPI, RequestResponseData} from "../../utils/types"

/**
 * Class for interacting with a node's InfoAPI.
 * 
 * @category RPCAPIs
 * 
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */ 
export class InfoAPI extends JRPCAPI{

    /**
     * Fetches the blockchainID from the node for a given alias.
     * 
     * @param alias The blockchain alias to get the blockchainID
     * 
     * @returns Returns a Promise<string> containing the base 58 string representation of the blockchainID.
     */
    getBlockchainID = async (alias:string):Promise<string> => {
        let params = {
            "alias":alias
        };
        return this.callMethod("info.getBlockchainID", params).then((response:RequestResponseData) => {
            return response.data["result"]["blockchainID"];
        });
    }

    /**
     * Fetches the networkID from the node.
     * 
     * @returns Returns a Promise<number> of the networkID.
     */
    getNetworkID = async ():Promise<number> => {
        let params = {};
        return this.callMethod("info.getNetworkID", params).then((response:RequestResponseData) => {
            return response.data["result"]["networkID"];
        });
    }

    /**
     * Fetches the network name this node is running on
     *
     * @returns Returns a Promise<string> containing the network name.
     */
    getNetworkName = async ():Promise<string> => {
        return this.callMethod("info.getNetworkName").then((response:RequestResponseData) => {
            return response.data["result"]["networkName"];
        });
    }

    /**
     * Fetches the nodeID from the node.
     * 
     * @returns Returns a Promise<string> of the nodeID.
     */
    getNodeID = async ():Promise<string> => {
        let params = {};
        return this.callMethod("info.getNodeID", params).then((response:RequestResponseData) => {
            return response.data["result"]["nodeID"];
        });
    }

    /**
     * Fetches the version of Gecko this node is running
     *
     * @returns Returns a Promise<string> containing the version of Gecko.
     */
    getNodeVersion = async ():Promise<string> => {
        return this.callMethod("info.getNodeVersion").then((response:RequestResponseData) => {
            return response.data["result"]["version"];
        });
    }

    /**
     * Returns the peers connected to the node.
     * 
     * @returns Promise for the list of connected peers in <ip>:<port> format.
     */
    peers = async ():Promise<Array<string>> => {
        return this.callMethod("info.peers").then((response:RequestResponseData) => {
            return response.data["result"]["peers"];
        });
    }
    constructor(core:AvalancheCore, baseurl:string = "/ext/info"){ super(core, baseurl); }
}

export default InfoAPI;