/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { Address, UTXOID, UnixNow, AVMConstants } from './types';

const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the TransferableOp and returns the proper Operation instance.
 * 
 * @param opbuffer A {@link https://github.com/feross/buffer|Buffer} containing the Operation raw data.
 * 
 * @returns An instance of an [[Operaton]]-extended class: [[NFTTransferOp]].
 */
export const SelectOperationClass = (opbuffer:Buffer, args:Array<any> = []):Operation => {
    let transOp:TransferableOp = new TransferableOp();
    transOp.fromBuffer(opbuffer);
    return transOp.getOperation();
}


/**
 * A class representing an operation. All operation types must extend on this class.
 */
export class Operation {
    protected opid:Buffer = Buffer.alloc(4);
    protected opidnum:number;


    getOutputID = ():number => {
        return this.opidnum;
    };

    fromBuffer(opbuff:Buffer, offset:number = 0):number {
        this.opid = bintools.copyFrom(opbuff, offset, offset + 4);
        this.opidnum = this.opid.readUInt32BE(0);
        offset += 4;
        return offset;
    };

    toBuffer():Buffer {
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
 * A class which contains an [[Operation]] for transfers.
 * 
 */
export class TransferableOp {
    protected assetid:Buffer = Buffer.alloc(32);
    protected numutxoIDs:Buffer = Buffer.alloc(4);
    protected utxoIDs:Array<UTXOID> = [];
    protected operation:Operation;

    fromBuffer(opbuff:Buffer, offset:number = 0):number {
        this.assetid = bintools.copyFrom(opbuff, offset, offset + 32);
        offset += 32;
        this.numutxoIDs = bintools.copyFrom(opbuff, offset, offset + 4);
        offset += 4;
        let numutxoIDs:number = this.numutxoIDs.readUInt32BE(0);
        this.utxoIDs = [];
        for(let i = 0; i < numutxoIDs; i++) {
            let utxoid:UTXOID = new UTXOID();
            let offsetEnd:number = offset + utxoid.getSize();
            let copied:Buffer = bintools.copyFrom(opbuff, offset, offsetEnd);
            utxoid.fromBuffer(copied);
            this.utxoIDs.push(utxoid);
            offset = offsetEnd;
        }
        let opcode:number = bintools.copyFrom(opbuff, offset, offset + 4).readUInt32BE(0);
        if(opcode === AVMConstants.NFTXFEROP) {
            this.operation = new NFTTransferOp();
        } else {
            throw new Error("Error - TransferableOp.fromBuffer: invalid opid: " + opcode);
        }
        this.operation.fromBuffer(opbuff);
        return offset;
    }

    toBuffer():Buffer {
        let bsize:number = this.assetid.length + this.numutxoIDs.length;
        let barr:Array<Buffer> = [this.assetid, this.numutxoIDs];
        for(let i = 0; i < this.utxoIDs.length; i++) {
            let b:Buffer = this.utxoIDs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        let b:Buffer = this.operation.toBuffer();
        bsize += b.length;
        barr.push(b);
        return Buffer.concat(barr, bsize);
    }

    /**
     * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getAssetID = ():Buffer => {
        return this.assetid;
    }

    getUTXOIDs = ():Array<UTXOID> => {
        return this.utxoIDs;
    }
    
    getOperation = ():Operation => {
        return this.operation;
    }

    constructor(assetid?:Buffer, utxoids?:Array<UTXOID|string|Buffer>, operation?:Operation) {
        if(typeof assetid !== 'undefined' && assetid.length == AVMConstants.ASSETIDLEN) {
            this.assetid = assetid;
        }
        if(typeof utxoids && Array.isArray(utxoids)){
            for(let i = 0; i < utxoids.length; i++){
                let utxoid:UTXOID = new UTXOID(); 
                if(typeof utxoids[i] === 'string'){
                    utxoid.fromString(utxoids[i] as string);
                } else if(utxoids[i] instanceof Buffer){
                    utxoid.fromBuffer(utxoids[i] as Buffer);
                } else if(utxoids[i] instanceof UTXOID){
                    utxoid.fromString(utxoids[i].toString()); //clone
                } else {
                    throw new Error("Error - TransferableOp.constructor: invalid utxoid in array parameter 'utxoids'");
                }
                this.utxoIDs.push(utxoid);
            }
        }
        if(operation instanceof Operation) {
            this.operation = operation;
        }
    }
}

/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
export class NFTTransferOp extends Operation {
    protected sizeAddrIndecies:Buffer;
    protected addrIndecies:Array<number> = [];
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
        throw new Error("Error - NFTTransferOp.getAddress: idx out of range");
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOp]] and returns the size of the output.
     */
    fromBuffer(opbuff:Buffer, offset:number = 0):number {
        this.opid.readUInt32BE(AVMConstants.NFTXFEROUTPUTID);
        this.opidnum = AVMConstants.NFTXFEROUTPUTID;
        offset += 4;
        this.sizeAddrIndecies = bintools.copyFrom(opbuff, offset, offset + 4);
        let sizeAddrIndecies:number = this.sizeAddrIndecies.readUInt32BE(0);
        offset += 4;
        for(let i:number = 0; i < sizeAddrIndecies; i++) {
            this.addrIndecies[i] = bintools.copyFrom(opbuff, offset, offset + 4).readUInt32BE(0);
            offset += 4;
        }
        this.addrIndecies.sort();
        this.groupID = bintools.copyFrom(opbuff, offset, offset + 4);
        offset += 4;
        this.sizePayload = bintools.copyFrom(opbuff, offset, offset + 4);
        let psize:number = this.sizePayload.readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(opbuff, offset, offset + psize);
        offset += psize;
        this.threshold = bintools.copyFrom(opbuff, offset, offset + 4);
        offset += 4;
        this.numaddrs = bintools.copyFrom(opbuff, offset, offset + 4);
        offset += 4;
        let numaddrs:number = this.numaddrs.readUInt32BE(0);
        this.addresses = [];
        for(let i = 0; i < numaddrs; i++){
            let addr:Address = new Address();
            let offsetEnd:number = offset + addr.getSize();
            let copied:Buffer = bintools.copyFrom(opbuff, offset, offsetEnd);
            addr.fromBuffer(copied);
            this.addresses.push(addr);
            offset = offsetEnd;
        }
        this.addresses.sort(Address.comparitor());
        return offset;
    }

    /**
     * Returns the buffer representing the [[NFTTransferOp]] instance.
     */
    toBuffer():Buffer {
        try {
            this.addrIndecies.sort();
            this.addresses.sort(Address.comparitor());
            let superbuff:Buffer = super.toBuffer();
            let idxarr:Array<Buffer> = [];
            let s:number = 0;
            for(let i = 0; i < this.addrIndecies.length; i++) {
                let b:Buffer = Buffer.alloc(4);
                s += 4;
                b.readUInt32BE(this.addrIndecies[i]);
                idxarr.push(b)
            }
            let addrIdxs:Buffer = Buffer.concat(idxarr, s);
            let bsize:number = superbuff.length + this.sizeAddrIndecies.length + addrIdxs.length + this.sizePayload.length + this.payload.length + this.threshold.length + this.numaddrs.length;
            this.sizeAddrIndecies.writeUInt32BE(this.addrIndecies.length, 0);
            this.numaddrs.writeUInt32BE(this.addresses.length, 0);
            this.sizePayload.writeUInt32BE(this.payload.length, 0);

            let barr:Array<Buffer> = [superbuff, this.sizeAddrIndecies, addrIdxs, this.groupID, this.sizePayload, this.payload, this.threshold, this.numaddrs];
            for(let i = 0; i < this.addresses.length; i++) {
                let b: Buffer = this.addresses[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            return Buffer.concat(barr,bsize);
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - NFTTransferOp.toBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 string representing the [[NFTTransferOp]].
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
     * An [[Operation]] class which contains an NFT on an assetID.
     * 
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     */
    constructor(groupID?:number, payload?:Buffer, addresses?:Array<Buffer>, threshold?:number){
        super(AVMConstants.NFTXFEROUTPUTID);
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

