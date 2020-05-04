/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { Address, UTXOID, UnixNow, AVMConstants } from './types';

const bintools = BinTools.getInstance();

/**
 * A class representing an operation. All operation types must extend on this class.
 */
export class Operation {
    protected opid:Buffer = Buffer.alloc(4);
    protected opidnum:number;
    protected sizeAddridx:Buffer;
    protected addridx:Array<number> = [];

    getOutputID = ():number => {
        return this.opidnum;
    };

    fromBuffer(opbuff:Buffer, offset:number = 0):number {
        this.opid = bintools.copyFrom(opbuff, offset, offset + 4);
        this.opidnum = this.opid.readUInt32BE(0);
        offset += 4;
        this.sizeAddridx = bintools.copyFrom(opbuff, offset, offset + 4);
        let sizeAddridx:number = 
        offset += 4;
        return offset + 4;
    };

    toBuffer():Buffer {
        this.addridx.sort();
        return this.opid;
    };

    toString():string {
        return bintools.bufferToB58(this.opid);
    };

    static comparator = ():(a:Operation, b:Operation) => (1|-1|0) => {
        return function(a:Operation, b:Operation):(1|-1|0) {
            return Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);
        }
    }

    constructor(opidnum:number) {
        this.opid.writeUInt32BE(opidnum, 0);
        this.opidnum = opidnum;
    }
}

/**
 * An [[Operation]] class which specifies an NFT Transfer Op .
 */
export class NFTTransferOp extends Operation {
    protected groupID:Buffer = Buffer.alloc(4);
    protected sizePayload:Buffer = Buffer.alloc(4);
    protected payload:Buffer;
    protected threshold:Buffer = Buffer.alloc(4);
    protected numaddrs:Buffer = Buffer.alloc(4);
    protected addresses:Array<Address> = [];

    /**
     * Returns the groupID as a number.
     */
    getGroupID = ():number => {
        return this.groupID.readUInt32BE(0);
    }

    /**
     * Returns the payload as a {@link https://github.com/feross/buffer|Buffer}
     */
    getPayload = ():Buffer => {
        return bintools.copyFrom(this.payload);
    }

    /**
     * Returns the threshold of signers required to spend this output.
     */
    getThreshold = ():number => {
        return this.threshold.readUInt32BE(0);
    }

    /**
     * Returns an array of {@link https://github.com/feross/buffer|Buffer}s for the addresses.
     */
    getAddresses = ():Array<Buffer> => {
        let result:Array<Buffer> = [];
        for(let i = 0; i < this.addresses.length; i++) {
            result.push(this.addresses[i].toBuffer())
        }
        return result;
    }

    /**
     * Returns the index of the address.
     * 
     * @param address A {@link https://github.com/feross/buffer|Buffer} of the address to look up to return its index.
     * 
     * @returns The index of the address.
     */
    getAddressIdx = (address:Buffer):number => {
        for(let i = 0; i < this.addresses.length; i++){
            if(this.addresses[i].toBuffer().toString("hex") == address.toString("hex")){
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
    getAddress = (idx:number):Buffer => {
        if(idx < this.addresses.length){
            return this.addresses[idx].toBuffer();
        }
        throw new Error("Error - SecpOutBase.getAddress: idx out of range");
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SecpOutBase]] and returns the size of the output.
     */
    fromBuffer(utxobuff:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(utxobuff, offset);
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.sizePayload = bintools.copyFrom(utxobuff, offset, offset + 4);
        let psize:number = this.sizePayload.readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(utxobuff, offset, offset + psize);
        offset += psize;
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
     * Returns the buffer representing the [[SecpOutBase]] instance.
     */
    toBuffer():Buffer {
        try {
            this.addresses.sort(Address.comparitor());
            let superbuff:Buffer = super.toBuffer();
            let bsize:number = superbuff.length + this.sizePayload.length + this.payload.length + this.threshold.length + this.numaddrs.length;
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
            this.sizePayload.writeUInt32BE(this.payload.length, 0);
            let barr:Array<Buffer> = [superbuff, this.sizePayload, this.payload, this.threshold, this.numaddrs];
            for(let i = 0; i < this.addresses.length; i++) {
                let b: Buffer = this.addresses[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            return Buffer.concat(barr,bsize);
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - SecpOutBase.toBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 string representing the [[SecpOutBase]].
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Given an array of addresses and an optional timestamp (which is ignored as there's no locktime, to stay in format with others), select an array of address {@link https://github.com/feross/buffer|Buffer}s of qualified spenders for the output.
     * 
     * 
     */
    getSpenders = (addresses:Array<Buffer>, asOf:BN = undefined):Array<Buffer> => {
        let qualified:Array<Buffer> = [];
        let now:BN;
        if(typeof asOf === 'undefined'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        /*
        let locktime:BN = bintools.fromBufferToBN(this.locktime);
        if(now.lte(locktime)){ //not unlocked, not spendable
            return qualified;
        }*/

        let threshold:number = this.threshold.readUInt32BE(0);

        for(let i = 0; i < this.addresses.length && qualified.length < threshold; i++) {
            for(let j = 0; j < addresses.length && qualified.length < threshold; j++){
                if(addresses[j].toString("hex") == this.addresses[i].toBuffer().toString("hex")){
                    qualified.push(addresses[j]);
                }
            }
        }

        return qualified;
    }

    /**
     * Given an array of address {@link https://github.com/feross/buffer|Buffer}s and an optional timestamp (which is ignored as there's no locktime, to stay in format with others), returns true if the addresses meet the threshold required to spend the output.
     */
    meetsThreshold = (addresses:Array<Buffer>, asOf:BN = undefined):boolean => {
        let now:BN;
        if(typeof asOf === 'undefined'){
            now = UnixNow();
        } else {
            now = asOf;
        }
        let qualified:Array<Buffer> = this.getSpenders(addresses, now);
        let threshold:number = this.threshold.readUInt32BE(0);
        if(qualified.length >= threshold){
            return true;
        }

        return false;
    }

    /**
     * An [[Output]] class which contains an NFT on an assetID.
     * 
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     */
    constructor(groupID?:number, payload?:Buffer, addresses?:Array<Buffer>, threshold?:number){
        super(AVMConstants.SECPOUTPUTID);
        if(groupID && addresses){
            this.groupID.readUInt32BE(groupID);
            this.sizePayload.readUInt32BE(payload.length);
            this.payload = bintools.copyFrom(payload, 0, payload.length);
            let addrs:Array<Address> = [];
            for(let i = 0; i < addresses.length; i++){
                addrs[i] = new Address();
                addrs[i].fromBuffer(addresses[i]);
            }
            this.addresses = addrs;
            this.addresses.sort(Address.comparitor());
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
            this.threshold.writeUInt32BE((threshold ? threshold : 1), 0);
        }
    }
}

/**
 * A class which contains a series of Ops.
 * 
 */
export class TransferableOp {
    protected assetid:Buffer = Buffer.alloc(32);
    protected numutxoIDs:Buffer = Buffer.alloc(4);
    protected utxoIDs:Array<UTXOID> = [];

    fromBuffer(opbuff:Buffer, offset:number = 0):number {
        this.assetid = bintools.copyFrom(opbuff, offset, offset + 32);
        offset += 32;
        this.numutxoIDs = bintools.copyFrom(opbuff, offset, offset + 4);
        offset += 4;
        let numutxoIDs:number = this.numutxoIDs.readUInt32BE(0);
        this.utxoIDs = [];
        for(let i = 0; i < numutxoIDs; i++){
            let utxoid:UTXOID = new UTXOID();
            let offsetEnd:number = offset + utxoid.getSize();
            let copied:Buffer = bintools.copyFrom(opbuff, offset, offsetEnd);
            utxoid.fromBuffer(copied);
            this.utxoIDs.push(utxoid);
            offset = offsetEnd;
        }
        return offset;
    }

    toBuffer():Buffer {
        let bsize:number = this.assetid.length + this.numutxoIDs.length;
        let barr:Array<Buffer> = [this.assetid, this.numutxoIDs];
        for(let i = 0; i < this.utxoIDs.length; i++) {
            let b: Buffer = this.utxoIDs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return Buffer.concat(barr, bsize);
    }

    /**
     * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getAssetID = ():Buffer => {
        return this.assetid;
    }

    constructor(assetid?:Buffer, groupID?:number, payload?:Buffer, addresses?:Array<Buffer>, threshold?:number){
        if(typeof assetid !== 'undefined' && assetid.length == AVMConstants.ASSETIDLEN) {
            this.assetid = assetid;
        }
    }
}