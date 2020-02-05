/**
 * @module AVMAPI
 */
import SlopesCore from '../../slopes';
import { Buffer } from "buffer/";
import { JRPCAPI, RequestResponseData } from "../../utils/types";
import { UTXOSet } from './utxos';
import { MergeRule, UnixNow } from './types';
import { AVMKeyChain } from './keychain';
import { TxUnsigned, Tx } from './tx';
import BN from "bn.js";
import BinTools from '../../utils/bintools';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * A class for defining the persistance behavior of this an API call.
 * 
 */
export class PersistanceOptions {
    protected name:string = undefined;
    protected overwrite:boolean = false;
    protected mergeRule:MergeRule = "union";

    /**
     * Returns the namespace of the instance
     */
    getName = ():string => {
        return this.name;
    }

    /**
     * Returns the overwrite rule of the instance
     */
    getOverwrite = ():boolean => {
        return this.overwrite;
    }

    /**
     * Returns the [[MergeRule]] of the instance
     */
    getMergeRule = ():MergeRule => {
        return this.mergeRule;
    }
    
    /**
     * 
     * @param name The namespace of the database the data
     * @param overwrite True if the data should be completey overwritten
     * @param MergeRule The type of process used to merge with existing data: "intersection", "differenceSelf", "differenceNew", "symDifference", "union", "unionMinusNew", "unionMinusSelf"
     * 
     * @remarks
     * The merge rules are as follows:
     *   * "intersection" - the intersection of the set
     *   * "differenceSelf" - the difference between the existing data and new set
     *   * "differenceNew" - the difference between the new data and the existing set
     *   * "symDifference" - the union of the differences between both sets of data
     *   * "union" - the unique set of all elements contained in both sets
     *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
     *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
     */
    constructor(name:string, overwrite:boolean = false, mergeRule:MergeRule) {
        this.name = name;
        this.overwrite = overwrite;
        this.mergeRule = mergeRule;
    }
}

/**
 * Class for interacting with a node endpoint that is using the AVM.
 * 
 * @category RPCAPIs
 * 
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Slopes.addAPI]] function to register this interface with Slopes.
 */ 
class AVMAPI extends JRPCAPI{

    /**
     * @ignore
     */
    protected keychain:AVMKeyChain = new AVMKeyChain();
    protected blockchainID:string = "";

    /**
     * Gets the blockchainID and returns it.
     * 
     * @returns The the provided string representing the blockchainID
     */
    getBlockchainID = ():string => {
        return this.blockchainID;
    }

    /**
     * Gets a reference to the keychain for this class.
     * 
     * @returns The instance of [[AVMKeyChain]] for this class
     */
    keyChain = ():AVMKeyChain => {
        return this.keychain;
    }

    /**
     * @ignore
     */
    newKeyChain = ():AVMKeyChain => {
        //warning, overwrites the old keychain
        this.keychain = new AVMKeyChain();
        return this.keychain;
    }

    /**
     * Creates an asset of a given amount and assigns it to the address provided.
     * 
     * @param amount The amount of the asset to be created. If Amount is 10, for example, there will be exist 10 units of the new asset
     * @param address The base 58 string representation of the address that holds all units of the new asset upon creation of the asset
     * 
     * @returns Returns a Promise<string> containing the base 58 string representation of the ID of the newly created asset.
     */
    createAsset = async (amount:number, address:string):Promise<string> => {
        let params = {
            "amount": amount,
            "address": address
        };
        return this.callMethod("avm.createAsset", params).then((response:RequestResponseData) => {
            return response.data["result"]["assetID"];
        });
    }

    /**
     * Retrieves an assets name and symbol.
     * 
     * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an AVA serialized string for the AssetID.
     * 
     * @returns Returns a Promise<object> with keys "name" and "symbol".
     */
    getAssetDescription = async(assetID:Buffer | string):Promise<{name:string;symbol:string}> => {
        let asset:string;
        if(typeof assetID !== "string"){
            asset = bintools.avaSerialize(assetID);
        } else {
            asset = assetID;
        }
        let params = {
            "assetID": asset
        };
        return this.callMethod("avm.getAssetDescription", params).then((response:RequestResponseData) => {
            return {name: response.data["result"]["name"], symbol: response.data["result"]["symbol"]};
        });
    }

    /**
     * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
     * 
     * @param txid The string representation of the transaction ID
     * 
     * @returns Returns a Promise<string> containing the status retrieved from the node
     */
    getTxStatus = async (txid:string):Promise<string> => {
        let params = {
            "txID": txid
        };
        return this.callMethod("avm.getTxStatus", params).then((response:RequestResponseData) => {
            return response.data["result"]["status"];
        });
    }

    /**
     * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
     * 
     * @param addresses An array of addresses as strings
     * @param persistOpts Options available to persist these UTXOs in local storage
     * 
     * @remarks 
     * persistOpts is optional and must be of type [[PersistanceOptions]]
     * 
     */
    getUTXOs = async (addresses:Array<string>, persistOpts:PersistanceOptions = undefined ):Promise<UTXOSet> => {
        let params = {
            "addresses": addresses
        };
        return this.callMethod("avm.getUTXOs", params).then((response:RequestResponseData) => {
            let utxos:UTXOSet = new UTXOSet();
            let data = response.data["result"]["utxos"];
            if(persistOpts && typeof persistOpts === 'object'){
                if(this.db.has(persistOpts.getName())){
                    let selfArray:Array<string> = this.db.get(persistOpts.getName());
                    if(Array.isArray(selfArray)){
                        utxos.addArray(data);
                        let self:UTXOSet = new UTXOSet();
                        self.addArray(selfArray);
                        self.mergeByRule(utxos, persistOpts.getMergeRule())
                        data = self.getAllUTXOStrings();
                    }
                }
                this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
            }
            utxos.addArray(data);
            return utxos;
        });
    }

    /**
     * Helper function which creates an unsigned transaction. For more granular control, you may create your own
     * [[TxUnsigned]] manually (with their corresponding [[Input]]s and [[Output]]s.
     * 
     * @param utxoset A set of UTXOs that the transaction is built on
     * @param amount The amount of AVA to be spent in NanoAVA
     * @param toAddresses The addresses to send the funds
     * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
     * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
     * @param assetID The assetID of the value being sent
     * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime The locktime field created in the resulting outputs
     * @param threshold The number of signatures required to spend the funds in the resultant UTXO
     * 
     * @returns An unsigned transaction created from the passed in parameters.
     * 
     * @remarks
     * This helper exists because the endpoint API should be the primary point of entry for most functionality.
     */
    makeUnsignedTx = (
        utxoset:UTXOSet, amount:BN, toAddresses:Array<string>, fromAddresses:Array<string>, 
        changeAddresses:Array<string>, assetID:Buffer | string = undefined, asOf:BN = UnixNow(), 
        locktime:BN = new BN(0), threshold:number = 1
    ):TxUnsigned => {
        if(typeof assetID === "string"){
            assetID = bintools.avaDeserialize(assetID);
        } 
        return utxoset.makeUnsignedTx(
            this.core.getNetworkID(), bintools.avaDeserialize(this.blockchainID), 
            amount, toAddresses, fromAddresses, changeAddresses, 
            assetID, asOf, locktime, threshold
        );
    }

    /**
     * Helper function which takes an unsigned transaction and signs it, returning the resulting [[Tx]].
     * 
     * @param utx The unsigned transaction of type [[TxUnsigned]]
     * 
     * @returns A signed transaction of type [[Tx]]
     */
    signTx = (utx:TxUnsigned):Tx => {
        return this.keychain.signTx(utx);
    }

    /**
     * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
     * 
     * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
     * 
     * @returns A Promise<string> representing the transaction ID of the posted transaction.
     */
    issueTx = async (tx:string | Buffer | Tx):Promise<string> => {
        let Transaction = new Tx();
        if(typeof tx === 'string'){
            Transaction.fromBuffer(bintools.avaDeserialize(tx));
        } else if(tx instanceof Buffer){
            Transaction.fromBuffer(tx);
        } else if(tx instanceof Tx) {
            Transaction = tx;
        } else {
            /* istanbul ignore next */
            throw new Error("Error - avm.issueTx: provided tx is not expected type of string, Buffer, or Tx");
        }
        let params = {
            "tx": Transaction.toString()
        };
        return this.callMethod("avm.issueTx", params).then((response:RequestResponseData) => {
            return response.data["result"]["txID"];
        });
    }
    /**
     * This class should not be instantiated directly. Instead use the [[Slopes.addAPI]] method.
     * 
     * @param core A reference to the Slopes class
     * @param baseurl Defaults to the string "/ext/bc/avm" as the path to subnets baseurl
     */
    constructor(core:SlopesCore, baseurl:string = "/ext/bc/avm", blockchainID:string = ""){ 
        super(core, baseurl);
        this.keychain = new AVMKeyChain();
        this.blockchainID = blockchainID
    }
}

export default AVMAPI;