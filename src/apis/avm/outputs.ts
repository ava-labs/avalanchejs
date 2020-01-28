/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { Address, UnixNow } from './types';

const bintools = BinTools.getInstance();

/**
 * Output Payment:
 * OutputID  | 04 bytes
 * AssetID   | 32 bytes
 * Amount    | 08 bytes
 * Locktime  | 08 bytes
 * Threshold | 04 bytes
 * NumAddrs  | 04 bytes
 * Repeated (NumAddrs):
 *     Addr  | 20 bytes
 */
/* Output Take-or-Leave:
 * OutputID      | 04 bytes
 * Amount        | 08 bytes
 * Locktime      | 08 bytes
 * Threshold     | 04 bytes
 * NumAddrs      | 04 bytes
 * Repeated (NumAddrs):
 *     Addr      | 20 bytes
 * FallLocktime  | 08 bytes
 * FallThreshold | 04 bytes
 * NumFallAddrs  | 04 bytes
 * Repeated (NumFallAddrs):
 *     Addr      | 20 bytes
 */

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 * 
 * @param outbuffer A {@link https://github.com/feross/buffer|Buffer} containing the Output raw data.
 * 
 * @returns An instance of an [[Output]]-extended class: [[OutputPayment]], [[OutTakeOrLeave]], [[OutCreateAsset]].
 */
export const SelectOutputClass = (outbuffer:Buffer, args:Array<any> = []):Output => {
    let outputid:number = outbuffer.readUInt32BE(0);
    if(outputid == 0){
        return new OutPayment(bintools.copyFrom(outbuffer,4,36), ...args);
    } else if (outputid == 1){
        return new OutTakeOrLeave(bintools.copyFrom(outbuffer,4,36), ...args);
    } else if(outputid == 2) {
        return new OutCreateAsset(...args);
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
}

/**
 * An abstract representing a transaction output. All output types must extend on this class.
 */
export abstract class Output {
    protected id:Buffer = Buffer.alloc(4);
    protected idnum:number;
    protected amount:Buffer = Buffer.alloc(8);
    protected amountValue:BN;

    abstract getOutputType:() => number;
    abstract getAmount:() => BN;
    abstract getAssetID:() => Buffer;

    abstract getAddresses:() => {[address:string]: BN};// address: locktimes
    abstract getAddressIdx:(address:string) => [number, boolean];
    abstract getAddress:(idx:number, tol:boolean) => string;
    abstract fromBuffer:(utxobuff:Buffer) => number;
    abstract toBuffer:() => Buffer;
    abstract toString:() => string;

    abstract getSpenders:(addresses:Array<string>, asOf:BN | boolean) => Array<string>;
    abstract meetsThreshold:(addresses:Array<string>, asOf:BN | boolean) => boolean;

    static comparitor = ():(a:Output, b:Output) => (1|-1|0) => {
        return function(a:Output, b:Output):(1|-1|0) { 
            return Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);
        }
    }

    constructor(amount?:BN, assetID?:Buffer) {
        if(amount){
            this.amountValue = amount.clone();
            this.amount = bintools.fromBNToBuffer(this.amountValue, 8);
        }
    }
}

/**
 * An [[Output]] class which creates an assetID.
 */
export class OutCreateAsset extends Output {
    protected locktime:Buffer = Buffer.alloc(8);
    protected threshold:Buffer = Buffer.alloc(4);
    protected numaddrs:Buffer = Buffer.alloc(4);
    protected addresses:Array<Address> = [];

    /**
     * @ignore
     */
    protected _CAGetAddresses = ():{[address:string]: BN} => {
        let result:{[address:string]: BN} = {};
        for(let i = 0; i < this.addresses.length; i++) {
            result[this.addresses[i].toString()] = bintools.fromBufferToBN(this.locktime);
        }
        return result;
    }

    /**
     * Returns the number for the output type of the output class.
     */
    getOutputType = ():number => {
        return this.idnum;
    };

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
     * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getAssetID = ():Buffer => {
        return bintools.fromBNToBuffer(new BN(0));
    }

    /**
     * Returns a map from all addresses as string keys to their locktime represented in {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAddresses = ():{[address:string]: BN} => {
        return this._CAGetAddresses();
    }

    /**
     * Returns an array of length 2 with the first index being the index of the provided address and the second being false (as fallback addresses are not available in this output type).
     * 
     * @param address Address to look up to return its index.
     * 
     * @returns An array of length 2, first index is the index the address resides in, second index is false.
     */
    getAddressIdx = (address:string):[number, boolean] => {
        let idx:number = -1;
        for(let i = 0; i < this.addresses.length; i++){
            if(this.addresses[i].toString() == address){
                idx = i;
                break;
            }
        }
        return [idx, false];
    }

    /**
     * Returns the address from the index provided.
     * 
     * @param idx The index of the address.
     * @param tol Unused, there for compatibility.
     * 
     * @returns Returns the string representing the address.
     */
    getAddress = (idx:number, tol:boolean = false):string => {
        if(idx < this.addresses.length){
            return this.addresses[idx].toString();
        }
        throw new Error("Error - OutPayment.getAddress: idx out of range");
    }

    /**
     * @ignore
     */
    protected _OCAParseBuffer = (utxobuff:Buffer, offset:number):number => {
        this.id = bintools.copyFrom(utxobuff, offset, offset + 4); //copied
        this.idnum = this.id.readUInt32BE(0);
        offset += 4;
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
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[OutCreateAsset]] and returns the size of the output.
     */
    fromBuffer = (utxobuff:Buffer):number => {
        return this._OCAParseBuffer(utxobuff, 0);
    }

    /**
     * @ignore
     */
    protected _OCATxBuffer = (): Buffer => {
        try {
            this.addresses.sort(Address.comparitor());
            let bsize:number = this.id.length  + this.amount.length + this.locktime.length + this.threshold.length + this.numaddrs.length;;
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
            let barr:Array<Buffer> = [this.id, this.amount, this.locktime, this.threshold, this.numaddrs];
            for(let i = 0; i < this.addresses.length; i++) {
                let b: Buffer = this.addresses[i].toBuffer();
                barr.push(b as Buffer);
                bsize += b.length;
            }
            let buff: Buffer = Buffer.concat(barr,bsize);
            return buff;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - TxOut._OPCABuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns the buffer representing the [[OutCreateAsset]] instance.
     */
    toBuffer = ():Buffer => {
        return this._OCATxBuffer();
    }

    /**
     * Returns a base-58 string representing the [[OutCreateAsset]].
     */
    toString = ():string => {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * @ignore
     */
    protected _OCAQualified = (addresses:Array<string>, asOf:BN | boolean = false):Array<string> => {
        let qualified:Array<string> = [];
        let now:BN;
        if(typeof asOf === 'boolean'){
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

        if(qualified.length >= threshold){
            return qualified;
        }
        return []
    }

    /**
     * Given an array of addresses and an optional timestamp, select an array of address strings of qualified spenders for the output.
     */
    getSpenders = (addresses:Array<string>, asOf:BN | boolean = false):Array<string> => {
        return this._OCAQualified(addresses, asOf);
    }

    /**
     * Given an array of addresses and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
     */
    meetsThreshold = (addresses:Array<string>, asOf:BN | boolean = false):boolean => {
        let now:BN;
        if(typeof asOf === 'boolean'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        let locktime:BN = bintools.fromBufferToBN(this.locktime);
        let qualified:Array<string> = this._OCAQualified(addresses, now);
        let threshold:number = this.threshold.readUInt32BE(0);
        if(now.lte(locktime)){
            return false;
        }
        if(qualified.length >= threshold){
            return true;
        }

        return false;
    }

    /**
     * An [[Output]] class which creates an assetID.
     * 
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of strings representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     */
    constructor(amount?:BN, addresses?:Array<string>, locktime?:BN, threshold?:number){
        super(amount);
        this.idnum = 2;
        this.id.writeUInt32BE(this.idnum, 0);
        if(amount && addresses){
            this.amountValue = amount.clone(); 
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

/**
 * An [[Output]] class which issues a payment on an assetID.
 */
export class OutPayment extends Output {
    protected assetid:Buffer = Buffer.alloc(32);
    protected locktime:Buffer = Buffer.alloc(8);
    protected threshold:Buffer = Buffer.alloc(4);
    protected numaddrs:Buffer = Buffer.alloc(4);
    protected addresses:Array<Address> = [];

    /**
     * @ignore
     */
    protected _OPGetAddresses = ():{[address:string]: BN} => {
        let result:{[address:string]: BN} = {};
        for(let i = 0; i < this.addresses.length; i++) {
            result[this.addresses[i].toString()] = bintools.fromBufferToBN(this.locktime);
        }
        return result;
    }

    /**
     * Returns the number for the output type of the output class.
     */
    getOutputType = ():number => {
        return this.idnum;
    };

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
     * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getAssetID = ():Buffer => {
        return this.assetid;
    }

    /**
     * Returns a map from all addresses as string keys to their locktime represented in {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAddresses = ():{[address:string]: BN} => {
        return this._OPGetAddresses();
    }

    /**
     * Returns an array of length 2 with the first index being the index of the provided address and the second being false (as fallback addresses are not available in this output type).
     * 
     * @param address Address to look up to return its index.
     * 
     * @returns An array of length 2, first index is the index the address resides in, second index is false.
     */
    getAddressIdx = (address:string):[number, boolean] => {
        let idx:number = -1;
        for(let i = 0; i < this.addresses.length; i++){
            if(this.addresses[i].toString() == address){
                idx = i;
                break;
            }
        }
        return [idx, false];
    }

    /**
     * Returns the address from the index provided.
     * 
     * @param idx The index of the address.
     * @param tol Unused, there for compatibility.
     * 
     * @returns Returns the string representing the address.
     */
    getAddress = (idx:number, tol:boolean = false):string => {
        if(idx < this.addresses.length){
            return this.addresses[idx].toString();
        }
        throw new Error("Error - OutPayment.getAddress: idx out of range");
    }

    /**
     * @ignore
     */
    protected _OPParseBuffer = (utxobuff:Buffer, offset:number):number => {
        this.id = bintools.copyFrom(utxobuff, offset, offset + 4); //copied
        this.idnum = this.id.readUInt32BE(0);
        offset += 4;
        this.assetid = bintools.copyFrom(utxobuff, offset, offset + 32);
        offset += 32;
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
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[OutCreateAsset]] and returns the size of the output.
     */
    fromBuffer = (utxobuff:Buffer):number => {
        return this._OPParseBuffer(utxobuff, 0);
    }

    /**
     * @ignore
     */
    protected _OPBuffer = (): Buffer => {
        try {
            this.addresses.sort(Address.comparitor());
            let bsize:number = this.id.length + this.assetid.length + this.amount.length + this.locktime.length + this.threshold.length + this.numaddrs.length;
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
            let barr:Array<Buffer> = [this.id, this.assetid, this.amount, this.locktime, this.threshold, this.numaddrs];
            for(let i = 0; i < this.addresses.length; i++) {
                let b: Buffer = this.addresses[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            let buff: Buffer = Buffer.concat(barr,bsize);
            return buff;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - TxOut._OPTxBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns the buffer representing the [[OutCreateAsset]] instance.
     */
    toBuffer = ():Buffer => {
        return this._OPBuffer();
    }

    /**
     * Returns a base-58 string representing the [[OutCreateAsset]].
     */
    toString = ():string => {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * @ignore
     */
    protected _OPQualified = (addresses:Array<string>, asOf:BN | boolean = false):Array<string> => {
        let qualified:Array<string> = [];
        let now:BN;
        if(typeof asOf === 'boolean'){
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
     * Given an array of addresses and an optional timestamp, select an array of address strings of qualified spenders for the output.
     */
    getSpenders = (addresses:Array<string>, asOf:BN | boolean = false):Array<string> => {
        return this._OPQualified(addresses, asOf);
    }

    /**
     * Given an array of addresses and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
     */
    meetsThreshold = (addresses:Array<string>, asOf:BN | boolean = false):boolean => {
        let now:BN;
        if(typeof asOf === 'boolean'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        let locktime:BN = bintools.fromBufferToBN(this.locktime);
        let qualified:Array<string> = this._OPQualified(addresses, now);
        let threshold:number = this.threshold.readUInt32BE(0);
        if(now.lte(locktime)){
            return false;
        }
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
    constructor(assetid:Buffer, amount?:BN, addresses?:Array<string>, locktime?:BN, threshold?:number){
        super(amount);
        this.assetid = assetid;
        this.idnum = 0;
        this.id.writeUInt32BE(this.idnum, 0);
        if(amount && addresses){
            this.amountValue = amount.clone();
            
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

/**
 * An [[Output]] class which issues a payment on an assetID and has fallback addresses and locktimes.
 */
export class OutTakeOrLeave extends OutPayment {
    protected fallLocktime:Buffer = Buffer.alloc(8);
    protected fallThreshold:Buffer = Buffer.alloc(4);
    protected numfalladdrs:Buffer = Buffer.alloc(4);
    protected fallAddresses:Array<Address>;

    /**
     * Returns the threshold of fallback signers required to spend this output.
     */
    getFallThreshold = ():number => {
        return this.fallThreshold.readUInt32BE(0);
    }

    /**
     * Returns the a {@link https://github.com/indutny/bn.js/|BN} repersenting the UNIX Timestamp when the fallback lock is made available.
     */
    getFallLocktime = ():BN => {
        return bintools.fromBufferToBN(this.fallLocktime);
    }

    /**
     * @ignore
     */
    protected _TOLGetAddresses = ():{[address:string]: BN} => {
        let result:{[address:string]: BN} = {};
        for(let i = 0; i < this.fallAddresses.length; i++){
            result[this.fallAddresses[i].toString()] = bintools.fromBufferToBN(this.fallLocktime);
        }
        return result;
    }

    /**
     * Returns a map from all addresses as string keys to their locktime represented in {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAddresses = ():{[address:string]: BN} => {
        return {...this._TOLGetAddresses(), ...this._OPGetAddresses() };
    }

    /**
     * Returns an array of length 2 with the first index being the index of the provided address and the second being false (as fallback addresses are not available in this output type).
     * 
     * @param address Address to look up to return its index.
     * 
     * @returns An array of length 2, first index is the index the address resides in, second index is false.
     */
    getAddressIdx = (address:string):[number, boolean] => {
        let idx:number = -1;
        let tol:boolean = false;
        for(let i = 0; i < this.addresses.length; i++){
            if(this.addresses[i].toString() == address){
                idx = i;
                break;
            }
        }
        if(idx == -1){
            for(let i = 0; i < this.fallAddresses.length; i++){
                if(this.fallAddresses[i].toString() == address){
                    idx = i;
                    tol = true;
                    break;
                }
            }
        }
        return [idx, tol];
    }

    /**
     * Returns the address from the index provided.
     * 
     * @param idx The index of the address.
     * @param tol Indicates whether the address is a take it or leave it
     * 
     * @returns Returns the string representing the address.
     */
    getAddress = (idx:number, tol:boolean = false):string => {
        if(!tol && idx < this.addresses.length){
            return this.addresses[idx].toString();
        } else if(tol && idx < this.fallAddresses.length){
            return this.fallAddresses[idx].toString();
        }
        throw new Error("Error - OutPayment.getAddress: idx out of range");
    }

    /**
     * @ignore
     */
    protected _TOLParseBuffer = (utxobuff:Buffer, offset:number) => {
        this.fallLocktime = bintools.copyFrom(utxobuff, offset, offset + 8);
        offset += 8;
        this.fallThreshold = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.numfalladdrs = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        let numfalladdrs = this.numfalladdrs.readUInt32BE(0);
        this.fallAddresses = [];
        for(let i = 0; i < numfalladdrs; i++){
            let addr = new Address();
            let offsetEnd = offset + addr.getSize();
            let copied = bintools.copyFrom(utxobuff, offset, offsetEnd);
            addr.fromBuffer(copied);
            this.fallAddresses.push(addr);
            offset = offsetEnd;
        }
        this.fallAddresses.sort(Address.comparitor());
        return offset;
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[OutTakeOrLeave]] and returns the size of the output.
     */
    fromBuffer = (utxobuff:Buffer):number => {
        let offset:number = this._OPParseBuffer(utxobuff, 0);
        let offset2:number = this._TOLParseBuffer(utxobuff, offset);
        return offset2;
    }

    /**
     * @ignore
     */
    protected _TOLBuffer = (): Buffer => {
        try {
            this.fallAddresses.sort(Address.comparitor());
            let bsize:number = this.fallLocktime.length + this.fallThreshold.length + this.numfalladdrs.length;
            this.numfalladdrs.writeUInt32BE(this.fallAddresses.length, 0);
            let barr:Array<Buffer> = [this.fallLocktime, this.fallThreshold, this.numfalladdrs];
            for(let i = 0; i < this.fallAddresses.length; i++) {
                let b:Buffer = this.fallAddresses[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            let buff: Buffer = Buffer.concat(barr,bsize);
            return buff;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - TxTakeOrLeave._TOLBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns the buffer representing the [[OutTakeOrLeave]] instance.
     */
    toBuffer = ():Buffer => {
        let pt1: Buffer = this._OPBuffer();
        let pt2: Buffer = this._TOLBuffer();        
        return Buffer.concat([pt1, pt2], pt1.length + pt2.length)
    }

    /**
     * Returns a base-58 string representing the [[OutTakeOrLeave]].
     */
    toString = ():string => {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * @ignore
     */
    protected _TOLQualified = (addresses:Array<string>, asOf:BN | boolean = false):Array<string> => {
        let qualified:Array<string> = [];
        let now:BN;
        if(typeof asOf === 'boolean'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        let locktime:BN = bintools.fromBufferToBN(this.fallLocktime);
        if(now.lte(locktime)){ //not unlocked, not spendable
            return qualified;
        }
        
        let threshold:number = this.fallThreshold.readUInt32BE(0);

        for(let i = 0; i < this.fallAddresses.length && qualified.length < threshold; i++) {
            for(let j = 0; j < addresses.length && qualified.length < threshold; j++){
                if(addresses[j] == this.fallAddresses[i].toString()){
                    qualified.push(addresses[j]);
                }
            }
        }
        return qualified;
    }

    /**
     * Given an array of addresses and an optional timestamp, select an array of address strings of qualified spenders for the output.
     */
    getSpenders = (addresses:Array<string>, asOf:BN | boolean = false):Array<string> => {
        let qualified:Array<string> = this._OPQualified(addresses, asOf);
        qualified = qualified.concat(this._TOLQualified(addresses, asOf));

        return [...new Set(qualified)];
    }

    /**
     * Given an array of addresses and an optional timestamp, returns true if the addresses meet the threshold required to spend the output.
     */
    meetsThreshold = (addresses:Array<string>, asOf:BN | boolean = false):boolean => {
        let now:BN;
        if(typeof asOf === 'boolean'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        let locktime:BN = bintools.fromBufferToBN(this.locktime);
        let fallLocktime:BN = bintools.fromBufferToBN(this.fallLocktime);
        let qualified:Array<string> = this._OPQualified(addresses, now);
        let threshold:number = this.threshold.readUInt32BE(0);
        if(now.lte(locktime)){
            return false;
        }
        if(qualified.length >= threshold){
            return true;
        }
        qualified = this._TOLQualified(addresses, now);
        threshold = this.fallThreshold.readUInt32BE(0);
        if(now.lte(fallLocktime)){
            return false;
        }
        if(qualified.length >= threshold){
            return true;
        }
        return false;
    }

    /**
     * An [[Output]] class which issues a payment on an assetID and has fallback addresses and locktimes.
     * 
     * @param assetid A {@link https://github.com/feross/buffer|Buffer} representing the AssetID
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of strings representing addresses
     * @param falladdresses An array of strings representing fallback addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param falllocktime A {@link https://github.com/indutny/bn.js/|BN} representing the fallback locktime
     * @param threshold A number representing the threshold number of signers required to sign the transaction
     * @param fallthreshold A number representing the fallback threshold number of signers required to sign the transaction
     */
    constructor(assetid:Buffer, amount?:BN, addresses?:Array<string>, falladdresses?:Array<string>, locktime?:BN, falllocktime?:BN, threshold?:number, fallthreshold?:number){
        super(assetid, amount, addresses, locktime, threshold);
        this.idnum = 1;
        this.id.writeUInt32BE(this.idnum, 0);
        if(amount && addresses && falladdresses && falllocktime){
            let addrs:Array<Address> = [];
            for(let i = 0; i < falladdresses.length; i++){
                addrs[i] = new Address();
                addrs[i].fromString(falladdresses[i]);
            }
            this.fallAddresses = addrs;
            this.fallAddresses.sort(Address.comparitor());
            this.numfalladdrs.writeUInt32BE(this.fallAddresses.length, 0);
            this.fallThreshold.writeUInt32BE((fallthreshold ? fallthreshold : 1), 0);
            if(!falllocktime) {
                /* istanbul ignore next */
                falllocktime = new BN(1);
            }
            this.fallLocktime = bintools.fromBNToBuffer(falllocktime, 8);
        }
    }
}
