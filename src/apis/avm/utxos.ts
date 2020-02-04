/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { Output, SecpOutput, SelectOutputClass } from './outputs';
import { MergeRule, UnixNow, Constants } from './types';
import { TxUnsigned } from './tx';
import { SecpInput } from './inputs';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();


/**
 * Takes a buffer representing the output and returns the proper UTXO instance.
 * 
 * @param utxobuffer A {@link https://github.com/feross/buffer|Buffer} containing the [[UTXO]] raw data.
 * 
 * @returns An instance of an [[UTXO]]-extended class. ex. [[SecpUTXO]].
 */
export const SelectUTXOClass = (utxobuffer:Buffer, args:Array<any> = []):UTXO => {
    let txid:Buffer = bintools.copyFrom(utxobuffer, 0, 32);
    let txidx:number = utxobuffer.readUInt32BE(32);
    let outputbuff:Buffer = bintools.copyFrom(utxobuffer, 36);
    let output:Output = SelectOutputClass(outputbuff);
    let outputid:number = output.getOutputID();
    if(outputid == Constants.SECPOUTPUTID){
        let secpout:SecpOutput = output as SecpOutput;
        let utxo:SecpUTXO = new SecpUTXO(txid, txidx, secpout);
        return utxo;
    }
    throw new Error("Error - SelectUTXOClass: unknown outputid " + outputid);
}

/**
 * Class for representing a single UTXO.
 */
export abstract class UTXO {
    protected txid:Buffer = Buffer.alloc(32);
    protected txidx:Buffer = Buffer.alloc(4);

    abstract getOuputID:() => number;

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
     */
    getTxID = ():Buffer => {
        return this.txid;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer}  of the TxIdx.
     */
    getTxIdx = ():Buffer => {
        return this.txidx;
    }

    /**
     * Returns the UTXOID as a base-58 string (UTXOID is a string )
     */
    getUTXOID = ():string => {
        return bintools.bufferToB58(Buffer.concat([this.getTxID(), this.getTxIdx()]));
    }

    _basicUTXOBuffer = (utxobuff) => {
        this.txid = bintools.copyFrom(utxobuff, 0, 32);
        this.txidx = bintools.copyFrom(utxobuff, 32, 36);
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[UTXO]]
     */
    fromBuffer = (utxobuff:Buffer) => {
        this._basicUTXOBuffer(utxobuff);
    }

    /**
     * Takes a base-58 string containing an [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
     * 
     * @param serialized A base-58 string containing a raw [[UTXO]]
     * 
     * @returns The length of the raw [[UTXO]]
     * 
     * @remarks 
     * unlike most fromStrings, it expects the string to be serialized in AVA format
     */
    fromString = (serialized:string) => {
        return this.fromBuffer( bintools.avaDeserialize(serialized) );
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[UTXO]].
     */
    toBuffer = ():Buffer => {
        try {
            let barr:Array<Buffer> = [this.txid, this.txidx];
            return Buffer.concat(barr, this.txid.length + this.txidx.length)
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - UTXO.toBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 representation of the [[UTXO]].
     * 
     * @remarks 
     * unlike most toStrings, this returns in AVA serialization format
     */
    toString = ():string => {
        return bintools.avaSerialize(this.toBuffer());
    }

    /**
     * Class for representing a single UTXO.
     * 
     * @param serialized Optional parameter of the serialized string representing a UTXO
     */
    constructor(txid?:Buffer, txidx:number = undefined) {
        if(txid && typeof txidx === "number") {
            this.txid = txid;
            this.txidx.writeUInt32BE(txidx, 0);
        }
    }
}


/**
 * Class for representing a single UTXO.
 */
export class SecpUTXO extends UTXO {
    protected output:SecpOutput = undefined;

    getOuputID = ():number => {
        return this.output.getOutputID();
    }

    /**
     * Gets the amount in the UTXO as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAmount = ():BN => {
        return this.output.getAmount();
    }

    /**
     * Gets the addresses in the UTXO as map of address to the locktime for the address as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAddresses = ():{[address:string]: BN} => {
        return this.output.getAddresses();
    };

    /**
     * Gets the index of the address in the output.
     * 
     * @returns An array of size two, the first index representing the index of the address, the second a boolean representing whether this result was a fallback (TakeItOrLeaveIt)
     */
    getAddressIdx = (address:string):number => {
        return this.output.getAddressIdx(address);
    }

    /**
     * Gets the address at the index.
     * 
     * @param idx The index of the address
     * 
     * @returns A string representing the address.
     */
    getAddress = (idx:number):string => {
        return this.output.getAddress(idx);
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} of the assetID.
     */
    getAssetID = ():Buffer => {
        let assetID = this.output.getAssetID();
        if(assetID){
            return assetID;
        }
        return this.getTxID();
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
     */
    getTxID = ():Buffer => {
        return this.txid;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer}  of the TxIdx.
     */
    getTxIdx = ():Buffer => {
        return this.txidx;
    }

    /**
     * Returns the UTXOID as a base-58 string (UTXOID is a string )
     */
    getUTXOID = ():string => {
        return bintools.bufferToB58(Buffer.concat([this.getTxID(), this.getTxIdx()]));
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[UTXO]]
     */
    fromBuffer = (utxobuff:Buffer) => {
        this._basicUTXOBuffer(utxobuff);
        let utxoOut = bintools.copyFrom(utxobuff, 36, utxobuff.length);
        this.output = SelectOutputClass(utxoOut) as SecpOutput;
        this.output.fromBuffer(utxoOut);
    }

    /**
     * Takes a base-58 string containing an [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
     * 
     * @param serialized A base-58 string containing a raw [[UTXO]]
     * 
     * @returns The length of the raw [[UTXO]]
     * 
     * @remarks 
     * unlike most fromStrings, it expects the string to be serialized in AVA format
     */
    fromString = (serialized:string) => {
        return this.fromBuffer( bintools.avaDeserialize(serialized) );
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[UTXO]].
     */
    toBuffer = ():Buffer => {
        try {
            let obuff = this.output.toBuffer();
            let barr:Array<Buffer> = [this.txid, this.txidx, obuff];
            return Buffer.concat(barr, this.txid.length + this.txidx.length + obuff.length)
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - UTXO.toBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 representation of the [[UTXO]].
     * 
     * @remarks 
     * unlike most toStrings, this returns in AVA serialization format
     */
    toString = ():string => {
        return bintools.avaSerialize(this.toBuffer());
    }

    /**
     * Given an array of addresses and an optional timestamp, returns an array of address strings of qualified spenders for the output.
     */
    getSpenders = (addresses:Array<string>, asOf:BN = undefined):Array<string> => {
        return this.output.getSpenders(addresses, asOf);
    }
    
    /**
     * Given an array of addresses and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
     */
    meetsThreshold = (addresses:Array<string>, asOf:BN = undefined) => {
        return this.output.meetsThreshold(addresses, asOf);
    }

    /**
     * Class for representing a single UTXO.
     * 
     * @param txid Optional {@link https://github.com/feross/buffer|Buffer} representing the transaction ID
     * @param txidx Optional number for the transaction index
     */
    constructor(txid:Buffer = undefined, txidx:number = undefined, secpoutput:SecpOutput = undefined) {
        super(txid, txidx);
        if(secpoutput){
            this.output = secpoutput;
        }
    }
}

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet {
    protected utxos:{[utxoid: string]: SecpUTXO } =  {};
    protected addressUTXOs:{[address: string]: {[utxoid: string]: BN}} = {}; // maps address to utxoids:locktime

    /**
     * Returns true if the [[UTXO]] is in the UTXOSet.
     * 
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     */
    includes = (utxo:UTXO | string):boolean => {
        let utxoX:UTXO;
        //force a copy
        if(typeof utxo === 'string') {
            utxoX = SelectUTXOClass(bintools.avaDeserialize(utxo));
        } else {
            utxoX = utxo; //forces a copy
        }
        let utxoid:string = utxoX.getUTXOID();
        return (utxoid in this.utxos);
    }

    /**
     * Adds a UTXO to the UTXOSet.
     * 
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     * 
     * @returns A true value if a [[UTXO]] was added and false if nothing was added.
     */
    add = (utxo:UTXO | string, overwrite:boolean = false):boolean => {
        let utxoX:UTXO;
        //force a copy
        if(typeof utxo === 'string') {
            utxoX = SelectUTXOClass(bintools.avaDeserialize(utxo));
        } else {
            utxoX = SelectUTXOClass(utxo.toBuffer()); //forces a copy
        }
        let secputxo;
        try {
            secputxo = utxoX as SecpUTXO;
        } catch (e) {
            return false;
        }
        let utxoid:string = secputxo.getUTXOID();
        if(!(utxoid in this.utxos) || overwrite === true){
            this.utxos[utxoid] = secputxo;

            let addresses:{[address:string]: BN} = secputxo.getAddresses(); //gets addresses and their locktime
            for(let [address, locktime] of Object.entries(addresses)){
                if(!(address in this.addressUTXOs)){
                    this.addressUTXOs[address] = {};
                }
                this.addressUTXOs[address][utxoid] = locktime;
            }
            return true;
        }
        return false;
    }

    /**
     * Adds an array of [[UTXO]]s to the [[UTXOSet]].
     * 
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     * 
     * @returns An array of UTXOs which were added.
     */
    addArray = (utxos:Array<string | UTXO>, overwrite:boolean = false):Array<UTXO> => {
        let added:Array<UTXO> = [];
        for(let i = 0; i < utxos.length; i++){
            let u:UTXO;
            if(typeof utxos[i]  === 'string') {
                u = SelectUTXOClass(bintools.avaDeserialize(utxos[i] as string));
            } else {
                u = SelectUTXOClass((utxos[i] as UTXO).toBuffer()); //forces a copy
            }
            if(this.add(u, overwrite)){
                added.push(u);
            }
        }
        return added;
    }

    /**
     * Removes a [[UTXO]] from the [[UTXOSet]] if it exists.
     * 
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * 
     * @returns A true value if a [[UTXO]] was removed and false if nothing was removed.
     */ 
    remove = (utxo:UTXO | string):boolean => {
        let utxoX:UTXO;
        //force a copy
        if(typeof utxo === 'string') {
            utxoX = SelectUTXOClass(bintools.avaDeserialize(utxo));
        } else {
            utxoX = SelectUTXOClass(utxo.toBuffer()); //forces a copy
        }
        let utxoid:string = utxoX.getUTXOID();
        if(!(utxoid in this.utxos)){
            return false;
        }
        delete this.utxos[utxoid];
        let addresses = Object.keys(this.addressUTXOs);
        for(let i = 0; i < addresses.length; i++) {
            if(utxoid in this.addressUTXOs[addresses[i]]){
                delete this.addressUTXOs[addresses[i]][utxoid];
            }
        }
        return true;
    }

    /**
     * Removes an array of [[UTXO]]s to the [[UTXOSet]].
     * 
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     * 
     * @returns An array of UTXOs which were removed.
     */
    removeArray = (utxos:Array<string | UTXO>):Array<UTXO> => {
        let removed:Array<UTXO> = [];
        for(let i = 0; i < utxos.length; i++){
            let u:UTXO;
            if(typeof utxos[i]  === 'string') {
                u = SelectUTXOClass(bintools.avaDeserialize(utxos[i] as string));
            } else {
                u = SelectUTXOClass((utxos[i] as UTXO).toBuffer()); //forces a copy
            }
            if(this.remove(u)){
                removed.push(u);
            }
        }
        return removed;
    }

    /**
     * Gets a [[UTXO]] from the [[UTXOSet]] by its UTXOID.
     * 
     * @param utxoid String representing the UTXOID
     * 
     * @returns A [[UTXO]] if it exists in the set.
     */
    getUTXO = (utxoid:string):UTXO => {
        return this.utxos[utxoid];
    }

    /**
     * Gets all the [[UTXO]]s, optionally that match with UTXOIDs in an array
     * 
     * @param utxoids An optional array of UTXOIDs, returns all [[UTXO]]s if not provided
     * 
     * @returns An array of [[UTXO]]s.
     */
    getAllUTXOs = (utxoids:Array<string> = undefined):Array<SecpUTXO> => {
        let results:Array<SecpUTXO> = [];
        if(typeof utxoids !== 'undefined' && Array.isArray(utxoids)){
            for(let i = 0; i < utxoids.length; i++){
                if(utxoids[i] in this.utxos && !(utxoids[i] in results)){
                    results.push(this.utxos[utxoids[i]]);
                }
            }
        } else {
            results = Object.values(this.utxos);
        }
        return results;
    }

    /**
     * Gets all the [[UTXO]]s as strings, optionally that match with UTXOIDs in an array.
     * 
     * @param utxoids An optional array of UTXOIDs, returns all [[UTXO]]s if not provided
     * 
     * @returns An array of [[UTXO]]s as AVA serialized strings.
     */
    getAllUTXOStrings = (utxoids:Array<string> = undefined):Array<string> => {
        let results:Array<string> = [];
        let utxos = Object.keys(this.utxos);
        if(typeof utxoids !== 'undefined' && Array.isArray(utxoids)){
            for(let i = 0; i < utxoids.length; i++){
                if(utxoids[i] in this.utxos){
                    results.push(this.utxos[utxoids[i]].toString());
                }
            }
        } else {
            for(let u of utxos){
                results.push(this.utxos[u].toString());
            }
        }
        return results;
    }

    /**
     * Returns an array of all the UTXOIDs in the [[UTXOSet]].
     */
    getUTXOIDs = ():Array<string> => {
        return Object.keys(this.utxos);
    }

    /**
     * Given an address or array of addresses, returns all the UTXOIDs for those addresses
     * 
     * @param address An address or array of addresses
     * @param spendable If true, only retrieves UTXOIDs whose locktime has passed
     * 
     * @returns An array of addresses.
     */
    getUTXOIDsByAddress = (address:string | Array<string>, spendable:boolean = true):Array<string> => {
        let results:Array<string> = [];
        if(typeof address === 'string'){
            address = [address];
        }        
        let now:BN = UnixNow();
        for(let i = 0; i < address.length; i++){
            if(address[i] in this.addressUTXOs){
                let entries = Object.entries(this.addressUTXOs[address[i]]);
                for(let [utxoid, locktime] of entries){
                    if(results.indexOf(utxoid) == -1 && (spendable && locktime.lte(now)) || !spendable) {
                        results.push(utxoid);
                    }
                }
            }
        }
        return results;
    }

    /**
     * Gets the addresses in the [[UTXOSet]].
     */
    getAddresses = ():Array<string> => {
        return Object.keys(this.addressUTXOs);
    }

    /**
     * Returns the balance of a set of addresses in the UTXOSet.
     * 
     * @param addresses An array of addresses
     * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an AVA serialized representation of an AssetID
     * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * 
     * @returns Returns the total balance as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getBalance = (addresses:Array<string>, assetID:Buffer|string, asOf:BN = undefined):BN => {
        let utxoids:Array<string> = this.getUTXOIDsByAddress(addresses);
        let utxos:Array<SecpUTXO> = this.getAllUTXOs(utxoids);
        let spend:BN = new BN(0);
        let asset:Buffer;
        if(typeof assetID === 'string'){
            asset = bintools.avaDeserialize(assetID);
        } else {
            asset = assetID;
        }
        for(let i = 0; i < utxos.length; i++){
            if(utxos[i].getAssetID().toString("hex") == asset.toString("hex") && utxos[i].meetsThreshold(addresses, asOf)){
                spend = spend.add(utxos[i].getAmount());
            }
        }
        return spend;
    }

    /**
     * Gets all the Asset IDs, optionally that match with Asset IDs in an array
     * 
     * @param utxoids An optional array of Addresses as string or Buffer, returns all Asset IDs if not provided
     * 
     * @returns An array of {@link https://github.com/feross/buffer|Buffer} representing the Asset IDs.
     */
    getAssetIDs = (addresses:string | Array<string> = undefined ):Array<Buffer> => {
        let results:Set<Buffer> = new Set();
        let utxoids:Array<string> = [];
        if(typeof addresses !== 'undefined'){
            utxoids = this.getUTXOIDsByAddress(addresses);
        } else {
            utxoids = this.getUTXOIDs();
        }
        
        for(let i = 0; i < utxoids.length; i++){
            if(utxoids[i] in this.utxos && !(utxoids[i] in results)){
                
                results.add(this.utxos[utxoids[i]].getAssetID());
            }
        }
        
        return [...results];
    }

    /**
     * Creates an unsigned transaction. For more granular control, you may create your own
     * [[TxUnsigned]] manually (with their corresponding [[Input]]s and [[Output]]s.
     * 
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param amount The amount of AVA to be spent in NanoAVA
     * @param toAddresses The addresses to send the funds
     * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
     * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs, locktime of BN(0) and a threshold of 1
     * @param assetID The assetID of the value being sent as a {@link https://github.com/indutny/bn.js/|BN}
     * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime The locktime field created in the resulting outputs
     * @param threshold The number of signatures required to spend the funds in the resultant UTXO
     * 
     * @returns An unsigned transaction created from the passed in parameters.
     * 
     */
    makeUnsignedTx = (networkid:number, blockchainid:Buffer, amount:BN, toAddresses:Array<string>, fromAddresses:Array<string>, changeAddresses:Array<string>, assetID:Buffer, asOf:BN = UnixNow(), locktime:BN = new BN(0), threshold:number = 1):TxUnsigned => {
        const zero:BN = new BN(0);
        let spendamount:BN = zero.clone();
        let utxos:Array<SecpUTXO> = this.getAllUTXOs(this.getUTXOIDsByAddress(fromAddresses));
        let change:BN = zero.clone();

        let outs:Array<SecpOutput> = [];
        let ins:Array<SecpInput> = [];

        outs.push(new SecpOutput(assetID, amount, toAddresses, locktime, threshold));

        for(let i = 0; i < utxos.length && spendamount.lt(amount); i++){
            if((assetID === undefined || (utxos[i].getAssetID().compare(assetID) == 0) && utxos[i].meetsThreshold(fromAddresses, asOf))){
                let amt:BN = utxos[i].getAmount().clone();
                spendamount = spendamount.add(amt);
                change = spendamount.sub(amount);
                change = change.gt(zero) ? change : zero.clone();

                let txid:Buffer = utxos[i].getTxID();
                let txidx:Buffer = utxos[i].getTxIdx();
                let input:SecpInput = new SecpInput(txid, txidx, amt, assetID);
                let spenders:Array<string> = utxos[i].getSpenders(fromAddresses, asOf);
                for(let j = 0; j < spenders.length; j++){
                    let idx:number;
                    idx = utxos[i].getAddressIdx(spenders[j]);
                    if(idx == -1){
                        /* istanbul ignore next */
                        throw new Error("Error - UTXOSet.makeUnsignedTx: no such address in output: " + spenders[j]);
                    }
                    input.addSignatureIdx(idx, spenders[j]);
                }
                ins.push(input);

                if(change.gt(zero)){
                    if(assetID) {
                        outs.push(new SecpOutput(assetID, change, changeAddresses, zero.clone(), 1));
                    } 
                    break;
                }
                /* istanbul ignore next */
                if(spendamount.gte(amount)){
                    break;
                }
            } else {
                continue;
            }
        }

        if(spendamount.lt(amount)){
            /* istanbul ignore next */
            throw new Error("Error - UTXOSet.makeUnsignedTx: insufficient funds to create the transaction");
        }

        return new TxUnsigned(ins, outs, networkid, blockchainid);
    }

    /**
     * Returns a new set with copy of UTXOs in this and set parameter.
     * 
     * @param utxoset The [[UTXOSet]] to merge with this one
     * @param hasUTXOIDs Will subselect a set of [[UTXO]]s which have the UTXOIDs provided in this array, defults to all UTXOs
     * 
     * @returns A new UTXOSet that contains all the filtered elements.
     */
    merge = (utxoset:UTXOSet, hasUTXOIDs:Array<string> = undefined): UTXOSet => {
        let results:UTXOSet = new UTXOSet();
        let utxos1:Array<UTXO> = this.getAllUTXOs(hasUTXOIDs);
        let utxos2:Array<UTXO> = utxoset.getAllUTXOs(hasUTXOIDs);
        let process = (utxo:UTXO) => {
            results.add(utxo);
        }
        utxos1.forEach(process);
        utxos2.forEach(process);
        return results;
    }

    /**
     * Set intersetion between this set and a parameter.
     * 
     * @param utxoset The set to intersect
     * 
     * @returns A new UTXOSet containing the intersection
     */
    intersection = (utxoset:UTXOSet):UTXOSet => {
        let results:Array<string>;
        let us1:Array<string> = this.getUTXOIDs();
        let us2:Array<string> = utxoset.getUTXOIDs();
        results = us1.filter(utxoid => us2.includes(utxoid));
        return this.merge(utxoset, results);
    }

    /**
     * Set difference between this set and a parameter.
     * 
     * @param utxoset The set to difference
     * 
     * @returns A new UTXOSet containing the difference
     */
    difference = (utxoset:UTXOSet):UTXOSet => {
        let results:Array<string>;
        let us1:Array<string> = this.getUTXOIDs();
        let us2:Array<string> = utxoset.getUTXOIDs();
        results = us1.filter(utxoid => !us2.includes(utxoid));
        return this.merge(utxoset, results);
    }

    /**
     * Set symmetrical difference between this set and a parameter.
     * 
     * @param utxoset The set to symmetrical difference
     * 
     * @returns A new UTXOSet containing the symmetrical difference
     */
    symDifference = (utxoset:UTXOSet):UTXOSet => {
        let results:Array<string>;
        let us1:Array<string> = this.getUTXOIDs();
        let us2:Array<string> = utxoset.getUTXOIDs();
        results = us1.filter(utxoid => !us2.includes(utxoid))
                .concat(us2.filter(utxoid => !us1.includes(utxoid)));
        return this.merge(utxoset, results);
    }

    /**
     * Set union between this set and a parameter.
     * 
     * @param utxoset The set to union
     * 
     * @returns A new UTXOSet containing the union
     */
    union = (utxoset:UTXOSet):UTXOSet => {
        return this.merge(utxoset);
    }

    /**
     * Merges a set by the rule provided.
     * 
     * @param utxoset The set to merge by the MergeRule
     * @param mergeRule The [[MergeRule]] to apply
     * 
     * @returns A new UTXOSet containing the merged data
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
    mergeByRule = (utxoset:UTXOSet, mergeRule:MergeRule):UTXOSet => {
        let uSet:UTXOSet;
        switch(mergeRule) {
            case 'intersection':
                return this.intersection(utxoset);
            case 'differenceSelf':
                return this.difference(utxoset);
            case 'differenceNew':
                return utxoset.difference(this);
            case 'symDifference':
                return this.symDifference(utxoset);
            case 'union':
                return this.union(utxoset);
            case 'unionMinusNew':
                uSet = this.union(utxoset);
                return uSet.difference(utxoset);
            case 'unionMinusSelf':
                uSet = this.union(utxoset);
                return uSet.difference(this);
            default:
                throw new Error("Error - UTXOSet.mergeByRule: bad MergeRule - " + mergeRule);
        }
        
    }
}
