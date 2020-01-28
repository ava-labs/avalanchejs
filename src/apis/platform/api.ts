/**
 * @module PlatformAPI
 */
import SlopesCore from '../../slopes';
import { JRPCAPI, RequestResponseData } from '../../utils/types';

/**
 * Class for interacting with a node's PlatformAPI
 * 
 * @category RPCAPIs
 * 
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Slopes.addAPI]] function to register this interface with Slopes.
 */ 
class PlatformAPI extends JRPCAPI{

    /**
     * Add a staked validator to the validator set.
     * 
     * @param tx The string representation of an AddStakerTx
     * 
     * @returns Promise for a boolean value, true on success.
     */
    addStaker = async (tx:string):Promise<boolean> => {
        let params = {
            "tx": tx
        };
        return this.callMethod("platform.addStaker", params).then((response:RequestResponseData) => {
            return response.data["result"]["success"];
        });
    }

    /**
     * Creates a new subnet.
     * 
     * @param tx The string representation of a createSubnetTx
     * 
     * @returns Promise for a boolean value, true on success.
     */
    createSubnet = async (tx:string):Promise<boolean> => {
        let params = {
            "tx": tx
        };
        return this.callMethod("platform.createSubnet", params).then((response:RequestResponseData) => {
            return response.data["result"]["success"];
        });
    }

    /**
     * Lists the current set of validators.
     * 
     * @returns Promise for an array of validator's stakingIDs.
     */
    listValidators = async ():Promise<Array<string>> => {
        return this.callMethod("platform.listValidators").then((response:RequestResponseData) => {
            return response.data["result"]["validators"];
        });
    }

    /**
     * Samples `Size` validators from the current validator set.
     * 
     * @param sampleSize Of the total universe of validators, select this many at random
     * 
     * @returns Promise for an array of validator's stakingIDs.
     */
    sampleValidators = async (sampleSize:number):Promise<Array<string>> => {
        let params = {
            "size": sampleSize
        };
        return this.callMethod("platform.sampleValidators", params).then((response:RequestResponseData) => {
            return response.data["result"]["validators"];
        });
    }

    /**
     * This class should not be instantiated directly. Instead use the [[Slopes.addAPI]] method.
     * 
     * @param core A reference to the Slopes class
     * @param baseurl Defaults to the string "/ext/subnet/platform" as the path to subnets baseurl
     */
    constructor(core:SlopesCore, baseurl:string = "/ext/subnet/platform"){ super(core, baseurl); }
}

export default PlatformAPI;