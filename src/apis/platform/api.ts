/**
 * @module PlatformAPI
 */
import AVACore from "../../slopes"
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

    constructor(ava:AVACore, baseurl:string = "/ext/platform"){ super(ava, baseurl); }
}

export default PlatformAPI;