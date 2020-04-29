/**
 * @module PlatformAPI
 */
import SlopesCore from '../../slopes';
import { JRPCAPI, RequestResponseData } from '../../utils/types';
import { Buffer } from "buffer/";
import BN from "bn.js";
import BinTools from '../../utils/bintools';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

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
     * Creates a new blockchain.
     * 
     * @param vmID The ID of the Virtual Machine the blockchain runs. Can also be an alias of the Virtual Machine.
     * @param name A human-readable name for the new blockchain
     * @param payerNonce The next unused nonce of the account paying the transaction fee
     * @param genesis The base 58 (with checksum) representation of the genesis state of the new blockchain. Virtual Machines should have a static API method named buildGenesis that can be used to generate genesisData.
     * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an AVA serialized string for the SubnetID or its alias.
     * 
     * @returns Promise for the unsigned transaction to create this blockchain. Must be signed by a sufficient number of the Subnet’s control keys and by the account paying the transaction fee.
     */
    createBlockchain = async (vmID:string, name:string, payerNonce: number, genesis:string, subnetID:Buffer | string = undefined):Promise<string> => {
        let params = {
            "vmID": vmID,
            "name": name,
            "payerNonce": payerNonce,
            "genesisData": genesis
        };
        if(typeof subnetID === "string"){
            params["subnetID"] = subnetID;
        } else if (typeof subnetID !== "undefined") {
            params["subnetID"] = bintools.avaSerialize(subnetID);
        }
        return this.callMethod("platform.createBlockchain", params).then((response:RequestResponseData) => {
            return response.data["result"]["blockchainID"];
        });
    }

    /**
     * Creates a new blockchain.
     * 
     * @param blockchainID The blockchainID requesting a status update
     * 
     * @returns Promise for a string of one of: "Validating", "Created", "Preferred", "Unknown".
     */
    getBlockchainStatus = async (blockchainID: string):Promise<string> => {
        let params = {
            "blockchainID": blockchainID
        };
        return this.callMethod("platform.getBlockchainStatus", params).then((response:RequestResponseData) => {
            return response.data["result"]["status"];
        });
    }

    /**
     * The P-Chain uses an account model. This method creates a P-Chain account on an existing user in the Keystore.
     * 
     * @param username The username of the Keystore user that controls the new account
     * @param password The password of the Keystore user that controls the new account
     * @param privateKey The private key that controls the account. If omitted, a new private key is generated
     * 
     * @returns Promise for a string of the newly created account address.
     */
    createAccount = async (username: string, password:string, privateKey:Buffer | string = undefined):Promise<string> => {
        let params = {
            "username": username,
            "password": password
        };
        if(typeof privateKey === "string"){
            params["privateKey"] = privateKey;
        } else if (typeof privateKey !== "undefined") {
            params["privateKey"] = bintools.avaSerialize(privateKey);
        }
        return this.callMethod("platform.createAccount", params).then((response:RequestResponseData) => {
            return response.data["result"]["address"];
        });
    }

    /**
     * The P-Chain uses an account model. An account is identified by an address. This method returns the account with the given address.
     * 
     * @param address The address of the account
     * 
     * @returns Promise for an object containing the address, the nonce, and the balance.
     */
    getAccount = async (address: string):Promise<object> => {
        let params = {
            "address": address
        };
        return this.callMethod("platform.getAccount", params).then((response:RequestResponseData) => {
            return response.data["result"];
        });
    }

    /**
     * List the accounts controlled by the user in the Keystore.
     * 
     * @param username The username of the Keystore user
     * @param password The password of the Keystore user
     * 
     * @returns Promise for an array of accounts.
     */
    listAccounts = async (username: string, password:string):Promise<Array<object>> => {
        let params = {
            "username": username,
            "password": password
        };
        return this.callMethod("platform.listAccounts", params).then((response:RequestResponseData) => {
            return response.data["result"]["accounts"];
        });
    }

    /**
     * Lists the set of current validators.
     * 
     * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an AVA serialized string for the SubnetID or its alias.
     * 
     * @returns Promise for an array of validators that are currently staking, see: {@link https://docs.ava.network/v1.0/en/api/platform/#platformgetcurrentvalidators|platform.getCurrentValidators documentation}.
     * 
     */
    getCurrentValidators = async (subnetID:Buffer | string = undefined):Promise<Array<string>> => {
        let params = {};
        if(typeof subnetID === "string"){
            params["subnetID"] = subnetID;
        } else if (typeof subnetID !== "undefined") {
            params["subnetID"] = bintools.avaSerialize(subnetID);
        }
        return this.callMethod("platform.getCurrentValidators", params).then((response:RequestResponseData) => {
            return response.data["result"]["validators"];
        });
    }

    /**
     * Lists the set of pending validators.
     * 
     * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an AVA serialized string for the SubnetID or its alias.
     * 
     * @returns Promise for an array of validators that are pending staking, see: {@link https://docs.ava.network/v1.0/en/api/platform/#platformgetpendingvalidators|platform.getPendingValidators documentation}.
     * 
     */
    getPendingValidators = async (subnetID:Buffer | string = undefined):Promise<Array<string>> => {
        let params = {};
        if(typeof subnetID === "string"){
            params["subnetID"] = subnetID;
        } else if (typeof subnetID !== "undefined") {
            params["subnetID"] = bintools.avaSerialize(subnetID);
        }
        
        return this.callMethod("platform.getPendingValidators", params).then((response:RequestResponseData) => {
            return response.data["result"]["validators"];
        });
    }

    /**
     * Samples `Size` validators from the current validator set.
     * 
     * @param sampleSize Of the total universe of validators, select this many at random
     * @param subnetID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an AVA serialized string for the SubnetID or its alias.
     * 
     * @returns Promise for an array of validator's stakingIDs.
     */
    sampleValidators = async (sampleSize:number, subnetID:Buffer | string = undefined):Promise<Array<string>> => {
        let params = {
            "size": sampleSize.toString()
        };
        if(typeof subnetID === "string"){
            params["subnetID"] = subnetID;
        } else if (typeof subnetID !== "undefined") {
            params["subnetID"] = bintools.avaSerialize(subnetID);
        }
        return this.callMethod("platform.sampleValidators", params).then((response:RequestResponseData) => {
            return response.data["result"]["validators"];
        });
    }

    /**
     * This class should not be instantiated directly. Instead use the [[Slopes.addAPI]] method.
     * 
     * @param core A reference to the Slopes class
     * @param baseurl Defaults to the string "/ext/platform" as the path to blockchain's baseurl
     */
    constructor(core:SlopesCore, baseurl:string = "/ext/P"){ super(core, baseurl); }
}

export default PlatformAPI;