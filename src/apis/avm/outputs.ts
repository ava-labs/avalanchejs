/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { Address, UnixNow, Constants } from './types';

const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 * 
 * @param outbuffer A {@link https://github.com/feross/buffer|Buffer} containing the Output raw data.
 * 
 * @returns An instance of an [[Output]]-extended class: [[OutputPayment]], [[OutTakeOrLeave]], [[OutCreateAsset]].
 */
export const SelectOutputClass = (outbuffer:Buffer, args:Array<any> = []):Output => {
    let assetid:Buffer = bintools.copyFrom(outbuffer, 0, Constants.ASSETIDLEN);
    let outputid:number = outbuffer.readUInt32BE(Constants.ASSETIDLEN);
    if(outputid == Constants.SECPOUTPUTID){
        let secpout:SecpOutput = new SecpOutput(assetid, ...args);
        secpout.fromBuffer(outbuffer);
        return secpout;
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
}

/**
 * A class representing a transaction output. All output types must extend on this class.
 */
export class Output {
    protected outputid:Buffer = Buffer.alloc(4);
    protected outputidnum:number;

    getOutputID = ():number => {
        return this.outputidnum;
    };

    fromBuffer(outbuff:Buffer, offset:number = 0):number {
        this.outputid = bintools.copyFrom(outbuff, offset, offset + 4);
        this.outputidnum = this.outputid.readUInt32BE(0);
        return offset + 4;
    };

    toBuffer():Buffer {
        return this.outputid;
    };

    toString():string {
        return bintools.bufferToB58(this.outputid);
    };

    static comparator = ():(a:Output, b:Output) => (1|-1|0) => {
        return function(a:Output, b:Output):(1|-1|0) { 
            return Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);
        }
    }

    constructor(outputidnum:number) {
        this.outputid.writeUInt32BE(outputidnum, 0);
        this.outputidnum = outputidnum;
    }
}

/**
 * An [[Output]] class which issues a payment on an assetID.
 */
export class SecpOutBasic extends Output {
    protected locktime:Buffer = Buffer.alloc(8);
    protected threshold:Buffer = Buffer.alloc(4);
    protected numaddrs:Buffer = Buffer.alloc(4);
    protected addresses:Array<Address> = [];
    protected amount:Buffer = Buffer.alloc(8);
    protected amountValue:BN = new BN(0);

    /**
     * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAmount = ():BN => {
        return this.amountValue.clone();
    }

    /**
     * Returns the threshold of signers required to spend this output.
     */
    getThreshold = ():number => {
        return this.threshold.readUInt32BE(0);
    }

    /**
     * Returns the a {@link https://github.com/indutny/bn.js/|BN} repersenting the UNIX Timestamp when the lock is made available.
     */
    getLocktime = ():BN => {
        return bintools.fromBufferToBN(this.locktime);
    }

    /**
     * Returns a map from all addresses as string keys to their locktime represented in {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAddresses = ():{[address:string]: BN} => {
        let result:{[address:string]: BN} = {};
        for(let i = 0; i < this.addresses.length; i++) {
            result[this.addresses[i].toString()] = bintools.fromBufferToBN(this.locktime);
        }
        return result;
    }

    /**
     * Returns an array of length 2 with the first index being the index of the provided address and the second being false (as fallback addresses are not available in this output type).
     * 
     * @param address Address to look up to return its index.
     * 
     * @returns An array of length 2, first index is the index the address resides in, second index is false.
     */
    getAddressIdx = (address:string):number => {
        for(let i = 0; i < this.addresses.length; i++){
            if(this.addresses[i].toString() == address){
                return i
            }
        }
        /* istanbul ignore next */
        return -1;
    }

    /**
     * Returns the address from the index provided.
     * 
     * @param idx The index of the address.
     * 
     * @returns Returns the string representing the address.
     */
    getAddress = (idx:number):string => {
        if(idx < this.addresses.length){
            return this.addresses[idx].toString();
        }
        throw new Error("Error - OutPayment.getAddress: idx out of range");
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[OutCreateAsset]] and returns the size of the output.
     */
    fromBuffer(utxobuff:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(utxobuff, offset);
        this.amount = bintools.copyFrom(utxobuff, offset, offset + 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
        offset += 8;
        this.locktime = bintools.copyFrom(utxobuff, offset, offset + 8);
        offset += 8;
        this.threshold = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.numaddrs = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        let numaddrs:number = this.numaddrs.readUInt32BE(0);
        this.addresses = [];
        for(let i = 0; i < numaddrs; i++){
            let addr:Address = new Address();
            let offsetEnd:number = offset + addr.getSize();
            let copied:Buffer = bintools.copyFrom(utxobuff, offset, offsetEnd);
            addr.fromBuffer(copied);
            this.addresses.push(addr);
            offset = offsetEnd;
        }
        this.addresses.sort(Address.comparitor());
        return offset;
    }

    /**
     * Returns the buffer representing the [[OutCreateAsset]] instance.
     */
    toBuffer():Buffer {
        try {
            this.addresses.sort(Address.comparitor());
            let superbuff:Buffer = super.toBuffer();
            let bsize:number = superbuff.length + this.amount.length + this.locktime.length + this.threshold.length + this.numaddrs.length;
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
            let barr:Array<Buffer> = [superbuff, this.amount, this.locktime, this.threshold, this.numaddrs];
            for(let i = 0; i < this.addresses.length; i++) {
                let b: Buffer = this.addresses[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            return Buffer.concat(barr,bsize);;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - TxOut._OPTxBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 string representing the [[OutCreateAsset]].
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Given an array of addresses and an optional timestamp, select an array of address strings of qualified spenders for the output.
     */
    getSpenders = (addresses:Array<string>, asOf:BN = undefined):Array<string> => {
        let qualified:Array<string> = [];
        let now:BN;
        if(typeof asOf === 'undefined'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        let locktime:BN = bintools.fromBufferToBN(this.locktime);
        if(now.lte(locktime)){ //not unlocked, not spendable
            return qualified;
        }

        let threshold:number = this.threshold.readUInt32BE(0);

        for(let i = 0; i < this.addresses.length && qualified.length < threshold; i++) {
            for(let j = 0; j < addresses.length && qualified.length < threshold; j++){
                if(addresses[j] == this.addresses[i].toString()){
                    qualified.push(addresses[j]);
                }
            }
        }

        return qualified;
    }

    /**
     * Given an array of addresses and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
     */
    meetsThreshold = (addresses:Array<string>, asOf:BN = undefined):boolean => {
        let now:BN;
        if(typeof asOf === 'undefined'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        let qualified:Array<string> = this.getSpenders(addresses, now);
        let threshold:number = this.threshold.readUInt32BE(0);
        if(qualified.length >= threshold){
            return true;
        }

        return false;
    }

    /**
     * An [[Output]] class which issues a payment on an assetID.
     * 
     * @param assetid A {@link https://github.com/feross/buffer|Buffer} representing the AssetID
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of strings representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     */
    constructor(amount?:BN, addresses?:Array<string>, locktime?:BN, threshold?:number){
        super(Constants.SECPOUTPUTID);
        if(amount && addresses){
            this.amountValue = amount.clone();
            this.amount = bintools.fromBNToBuffer(amount, 8);
            let addrs:Array<Address> = [];
            for(let i = 0; i < addresses.length; i++){
                addrs[i] = new Address();
                addrs[i].fromString(addresses[i]);
            }
            this.addresses = addrs;
            this.addresses.sort(Address.comparitor());
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
            this.threshold.writeUInt32BE((threshold ? threshold : 1), 0);
            if(!(locktime)){
                /* istanbul ignore next */
                locktime = new BN(0);
            }
            this.locktime = bintools.fromBNToBuffer(locktime, 8);
        }
    }
}

export class SecpOutput extends SecpOutBasic {
    protected assetid:Buffer = Buffer.alloc(32);

    fromBuffer(outbuff:Buffer, offset:number = 0):number {
        this.assetid = bintools.copyFrom(outbuff, offset, offset + 32);
        offset += 32;
        offset = super.fromBuffer(outbuff, offset);
        return offset;
    }

    toBuffer():Buffer {
        let superbuff:Buffer = super.toBuffer();
        return Buffer.concat([this.assetid, superbuff]);
    }

    /**
     * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getAssetID = ():Buffer => {
        return this.assetid;
    }

    constructor(assetid?:Buffer, amount?:BN, addresses?:Array<string>, locktime?:BN, threshold?:number){
        super(amount, addresses, locktime, threshold);
        if(typeof assetid !== 'undefined' && assetid.length == Constants.ASSETIDLEN) {
            this.assetid = assetid;
        }
    }
}