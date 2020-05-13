/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { Output, SecpOutput, AmountOutput, SelectOutputClass, NFTTransferOutput } from './outputs';
import { MergeRule, UnixNow, AVMConstants, InitialStates } from './types';
import { UnsignedTx, CreateAssetTx, OperationTx } from './tx';
import { SecpInput, Input } from './inputs';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Class for representing a single UTXO.
 */
export class UTXO {
    protected txid:Buffer = Buffer.alloc(32);
    protected outputidx:Buffer = Buffer.alloc(4);
    protected assetid:Buffer = Buffer.alloc(32);
    protected output:Output = undefined;

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
     */
    getTxID = ():Buffer => {
        /* istanbul ignore next */
        return this.txid;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer}  of the TxIdx.
     */
    getOutputIdx = ():Buffer => {
        /* istanbul ignore next */
        return this.outputidx;
    }

    /**
     * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getAssetID = ():Buffer => {
        return this.assetid;
    }

    /**
     * Returns the UTXOID as a base-58 string (UTXOID is a string )
     */
    getUTXOID = ():string => {
        /* istanbul ignore next */
        return bintools.bufferToB58(Buffer.concat([this.getTxID(), this.getOutputIdx()]));
    }


    /**
     * Returns a reference to the output;
    */
    getOutput = ():Output => {
        return this.output;
    }


    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[UTXO]]
     */
    fromBuffer(utxobuff:Buffer, offset:number = 0):number {
        this.txid = bintools.copyFrom(utxobuff, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(utxobuff, offset, offset + 32);
        offset += 32;
        let outputid:number = bintools.copyFrom(utxobuff, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.output = SelectOutputClass(outputid, bintools.copyFrom(utxobuff, offset)); 
        return offset;
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
    fromString(serialized:string) {
        /* istanbul ignore next */
        return this.fromBuffer( bintools.avaDeserialize(serialized) );
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[UTXO]].
     */
    toBuffer():Buffer {
        /* istanbul ignore next */
        try {
            let outbuff:Buffer = this.output.toBuffer();
            let outputidbuffer:Buffer = Buffer.alloc(4);
            outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
            let barr:Array<Buffer> = [this.txid, this.outputidx, this.assetid, outputidbuffer, outbuff];
            return Buffer.concat(barr, this.txid.length + this.outputidx.length + this.assetid.length + outputidbuffer.length + outbuff.length);
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
    toString():string {
        /* istanbul ignore next */
        return bintools.avaSerialize(this.toBuffer());
    }

    /**
     * Class for representing a single UTXO.
     * 
     * @param txid Optional {@link https://github.com/feross/buffer|Buffer} of transaction ID for the UTXO
     * @param txidx Optional {@link https://github.com/feross/buffer|Buffer} or number for the index of the transaction's [[Output]]
     * @param assetid Optional {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
     * @param outputid Optional {@link https://github.com/feross/buffer|Buffer} or number of the output ID for the UTXO
     */
    constructor(txid:Buffer = undefined, outputidx:Buffer | number = undefined, assetid:Buffer = undefined, output:Output = undefined) {
        if(typeof txid !== "undefined" && typeof outputidx === "number") {
            this.txid = txid;
            this.outputidx.writeUInt32BE(outputidx, 0);
            this.assetid = assetid;
            this.output = output;
        }
    }
}

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet {
    protected utxos:{[utxoid: string]: UTXO } =  {};
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
            utxoX.fromBuffer(bintools.avaDeserialize(utxo));
        } else {
            utxoX.fromBuffer(utxo.toBuffer()); //forces a copy
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
     * @returns A [[UTXO]] if one was added and undefined if nothing was added.
     */
    add = (utxo:UTXO | string, overwrite:boolean = false):UTXO => {
        let utxovar:UTXO;
        //force a copy
        if(typeof utxo === 'string') {
            utxovar.fromBuffer(bintools.avaDeserialize(utxo));
        } else {
            utxovar.fromBuffer(utxo.toBuffer()); //forces a copy
        }
        let utxoid:string = utxovar.getUTXOID();
        if(!(utxoid in this.utxos) || overwrite === true){
            this.utxos[utxoid] = utxovar;

            let addresses:Array<Buffer> = utxovar.getOutput().getAddresses();
            let locktime:BN = utxovar.getOutput().getLocktime();
            for(let i = 0; i < addresses.length; i++){
                let address:string = addresses[i].toString("hex");
                if(!(address in this.addressUTXOs)){
                    this.addressUTXOs[address] = {};
                }
                this.addressUTXOs[address][utxoid] = locktime;
            }
            return utxovar;
        }
        return undefined;
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
            let result:UTXO = this.add(utxos[i], overwrite)
            if(typeof result !== 'undefined'){
                added.push(result);
            }
        }
        return added;
    }

    /**
     * Removes a [[UTXO]] from the [[UTXOSet]] if it exists.
     * 
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * 
     * @returns A [[UTXO]] if it was removed and undefined if nothing was removed.
     */ 
    remove = (utxo:UTXO | string):UTXO => {
        let utxovar:UTXO;
        //force a copy
        if(typeof utxo === 'string') {
            utxovar.fromBuffer(bintools.avaDeserialize(utxo));
        } else {
            utxovar.fromBuffer(utxo.toBuffer()); //forces a copy
        }
        let utxoid:string = utxovar.getUTXOID();
        if(!(utxoid in this.utxos)){
            return undefined;
        }
        delete this.utxos[utxoid];
        let addresses = Object.keys(this.addressUTXOs);
        for(let i = 0; i < addresses.length; i++) {
            if(utxoid in this.addressUTXOs[addresses[i]]){
                delete this.addressUTXOs[addresses[i]][utxoid];
            }
        }
        return utxovar;
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
            let result:UTXO = this.remove(utxos[i]);
            if(typeof result !== 'undefined'){
                removed.push(result);
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
    getAllUTXOs = (utxoids:Array<string> = undefined):Array<UTXO> => {
        let results:Array<UTXO> = [];
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
     * Given an address or array of addresses, returns all the UTXOIDs for those addresses
     * 
     * @param address An array of address {@link https://github.com/feross/buffer|Buffer}s
     * @param spendable If true, only retrieves UTXOIDs whose locktime has passed
     * 
     * @returns An array of addresses.
     */
    getUTXOIDs = (addresses:Array<Buffer> = undefined, spendable:boolean = true):Array<string> => {
        if(typeof addresses !== "undefined") {
            let results:Array<string> = [];       
            let now:BN = UnixNow();
            for(let i = 0; i < addresses.length; i++){
                if(addresses[i].toString("hex") in this.addressUTXOs){
                    let entries = Object.entries(this.addressUTXOs[addresses[i].toString("hex")]);
                    for(let [utxoid, locktime] of entries){
                        if(results.indexOf(utxoid) == -1 && (spendable && locktime.lte(now)) || !spendable) {
                            results.push(utxoid);
                        }
                    }
                }
            }
            return results;
        }
        return Object.keys(this.utxos);
    }

    /**
     * Gets the addresses in the [[UTXOSet]] and returns an array of {@link https://github.com/feross/buffer|Buffer}.
     */
    getAddresses = ():Array<Buffer> => {
        return Object.keys(this.addressUTXOs).map(k => Buffer.from(k, "hex"));
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
    getBalance = (addresses:Array<Buffer>, assetID:Buffer|string, asOf:BN = undefined):BN => {
        let utxoids:Array<string> = this.getUTXOIDs(addresses);
        let utxos:Array<UTXO> = this.getAllUTXOs(utxoids);
        let spend:BN = new BN(0);
        let asset:Buffer;
        if(typeof assetID === 'string'){
            asset = bintools.avaDeserialize(assetID);
        } else {
            asset = assetID;
        }
        for(let i = 0; i < utxos.length; i++){
            if(utxos[i].getOutput() instanceof AmountOutput && utxos[i].getAssetID().toString("hex") == asset.toString("hex") && utxos[i].getOutput().meetsThreshold(addresses, asOf)){
                spend = spend.add((utxos[i].getOutput() as AmountOutput).getAmount());
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
    getAssetIDs = (addresses:Array<Buffer> = undefined ):Array<Buffer> => {
        let results:Set<Buffer> = new Set();
        let utxoids:Array<string> = [];
        if(typeof addresses !== 'undefined'){
            utxoids = this.getUTXOIDs(addresses);
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
     * [[TxUnsigned]] manually (with their corresponding [[Input]]s and [[Output]]s).
     * 
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param utxoid A UTXOID that the transaction is sending
     * @param toAddresses The addresses to send the funds
     * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
     * @param threshold The number of signatures required to spend the funds in the resultant UTXO
     * 
     * @returns An unsigned transaction created from the passed in parameters.
     * 
     */
    makeUnsignedNFTTx = (
            networkid:number, 
            blockchainid:Buffer, 
            utxoid:string,
            toAddresses:Array<Buffer>, 
            fromAddresses:Array<Buffer>, 
            // these things will be added later
            //feeAddresses:Array<Buffer>,
            //feeAmount:BN,
            //asOf:BN = UnixNow(), 
            threshold:number = 1
        ):TxUnsigned => {
        const zero:BN = new BN(0);
        let spendamount:BN = zero.clone();
        //let utxos:Array<SecpUTXO> = this.getAllUTXOs(this.getUTXOIDs(feeAddresses));
        let change:BN = zero.clone();
        //let assetid = 

        let outs:Array<SecpOutput> = [];
        let ins:Array<SecpInput> = [];
        //the below code can be used for fees once implemented
        /* 
        if(!feeAmount.gte(zero)){
            outs.push(new SecpOutput(assetID, feeAmount, [], locktime, threshold));

            for(let i = 0; i < utxos.length && spendamount.lt(feeAmount); i++){
                if((assetID === undefined || (utxos[i].getAssetID().compare(assetID) == 0) && utxos[i].meetsThreshold(feeAddresses, asOf))){
                    let amt:BN = utxos[i].getAmount().clone();
                    spendamount = spendamount.add(amt);
                    change = spendamount.sub(feeAmount);
                    change = change.gt(zero) ? change : zero.clone();

                    let txid:Buffer = utxos[i].getTxID();
                    let txidx:Buffer = utxos[i].getTxIdx();
                    let input:SecpInput = new SecpInput(txid, txidx, amt, assetID);
                    let spenders:Array<Buffer> = utxos[i].getSpenders(feeAddresses, asOf);
                    for(let j = 0; j < spenders.length; j++){
                        let idx:number;
                        idx = utxos[i].getAddressIdx(spenders[j]);
                        if(idx == -1){
                            
                            throw new Error("Error - UTXOSet.makeUnsignedTx: no such address in output: " + spenders[j]);
                        }
                        input.addSignatureIdx(idx, spenders[j]);
                    }
                    ins.push(input);

                    if(change.gt(zero)){
                        if(assetID) {
                            outs.push(new SecpOutput(assetID, change, feeAddresses, zero.clone(), 1));
                        } 
                        break;
                    }
                    if(spendamount.gte(feeAmount)){
                        break;
                    }
                } else {
                    continue;
                }
            }

            if(spendamount.lt(feeAmount)){
                throw new Error("Error - UTXOSet.makeUnsignedNFTTx: insufficient funds to create the transaction");
            }
        }
        */

        let nftutxo = this.getUTXO(utxoid);
        nftutxo.

        return new TxOperation(ops, ins, outs, networkid, blockchainid);
    }

    /**
     * Creates an unsigned transaction. For more granular control, you may create your own
     * [[TxUnsigned]] manually (with their corresponding [[Input]]s and [[Output]]s).
     * 
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param amount The amount of AVA to be spent in $nAVA
     * @param toAddresses The addresses to send the funds
     * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
     * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
     * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime The locktime field created in the resulting outputs
     * @param threshold The number of signatures required to spend the funds in the resultant UTXO
     * 
     * @returns An unsigned transaction created from the passed in parameters.
     * 
     */
    makeUnsignedTx = (
            networkid:number, 
            blockchainid:Buffer, 
            amount:BN, 
            toAddresses:Array<Buffer>, 
            fromAddresses:Array<Buffer>, 
            changeAddresses:Array<Buffer>, 
            assetID:Buffer, 
            asOf:BN = UnixNow(), 
            locktime:BN = new BN(0), 
            threshold:number = 1
        ):TxUnsigned => {
        const zero:BN = new BN(0);
        let spendamount:BN = zero.clone();
        let utxos:Array<SecpUTXO> = this.getAllUTXOs(this.getUTXOIDs(fromAddresses));
        let change:BN = zero.clone();

        let outs:Array<SecpOutput> = [];
        let ins:Array<SecpInput> = [];

        if(!amount.eq(zero)){
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
                    let spenders:Array<Buffer> = utxos[i].getSpenders(fromAddresses, asOf);
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
        }

        return new UnsignedTx(networkid, blockchainid, outs, ins);
    }

    /**
     * Creates an unsigned NFT transfer transaction. For more granular control, you may create your own
     * [[TxOperation]] manually (with their corresponding [[Input]]s, [[Output]]s).
     * 
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param fee The amount of AVA to be paid for fees, in $nAVA
     * @param creatorAddresses The addresses to send the fees
     * @param initialState The [[InitialStates]]that represent the intial state of a created asset
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVA = 10^9 $nAVA
     * 
     * @returns An unsigned transaction created from the passed in parameters.
     * 
     */
    makeOperationTx = (
        networkid:number, blockchainid:Buffer, avaAssetID:Buffer, 
        fee:BN, creatorAddresses:Array<Buffer>, 
        initialState:InitialStates, name:string, 
        symbol:string, denomination:number
    ):CreateAssetTx => {
        // Cheating and using makeUnsignedTx to get Ins and Outs for fees.
        // Fees are burned, so no toAddresses, only fromAddresses and changeAddresses, both are the creatorAddresses
        let utx:UnsignedTx = this.makeUnsignedTx(networkid, blockchainid, fee, [], creatorAddresses, creatorAddresses, avaAssetID);
        let ins:Array<Input> = utx.getIns();
        let outs:Array<Output> = utx.getOuts();
        return new CreateAssetTx(name, symbol, denomination, initialState, ins, outs, networkid, blockchainid, AVMConstants.CREATEASSETTX);
    }

    /**
     * Creates an unsigned transaction. For more granular control, you may create your own
     * [[TxCreateAsset]] manually (with their corresponding [[Input]]s, [[Output]]s).
     * 
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param fee The amount of AVA to be paid for fees, in $nAVA
     * @param creatorAddresses The addresses to send the fees
     * @param initialState The [[InitialStates]]that represent the intial state of a created asset
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVA = 10^9 $nAVA
     * 
     * @returns An unsigned transaction created from the passed in parameters.
     * 
     */
    makeCreateAssetTx = (
        networkid:number, blockchainid:Buffer, avaAssetID:Buffer, 
        fee:BN, creatorAddresses:Array<Buffer>, 
        initialState:InitialStates, name:string, 
        symbol:string, denomination:number
    ):CreateAssetTx => {
        // Cheating and using makeUnsignedTx to get Ins and Outs for fees.
        // Fees are burned, so no toAddresses, only fromAddresses and changeAddresses, both are the creatorAddresses
        let utx:UnsignedTx = this.makeUnsignedTx(networkid, blockchainid, fee, [], creatorAddresses, creatorAddresses, avaAssetID);
        let ins:Array<Input> = utx.getIns();
        let outs:Array<Output> = utx.getOuts();
        return new CreateAssetTx(name, symbol, denomination, initialState, ins, outs, networkid, blockchainid, AVMConstants.CREATEASSETTX);
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
