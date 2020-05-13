/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import { UTXOID, AVMConstants } from './types';
import { NFTTransferOutput } from './outputs';

const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 * 
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 * 
 * @returns An instance of an [[Operation]]-extended class.
 */
export const SelectOperationClass = (opid:number, ...args:Array<any>):Operation => {
    if(opid == AVMConstants.NFTXFEROP){
        let nftop:NFTTransferOperation = new NFTTransferOperation(...args);
        return nftop;
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectOperationClass: unknown opid " + opid);
}


/**
 * A class representing an operation. All operation types must extend on this class.
 */
export abstract class Operation {

    abstract getOperationID():number;

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        return 0;
    }
    abstract toBuffer():Buffer;

    constructor(){}

}

/**
 * A class which contains an [[Operation]] for transfers.
 * 
 */
export class TransferableOperation {
    protected assetid:Buffer = Buffer.alloc(32);
    protected numutxoIDs:Buffer = Buffer.alloc(4);
    protected utxoIDs:Array<UTXOID> = [];
    protected operation:Operation;

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numutxoIDs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let numutxoIDs:number = this.numutxoIDs.readUInt32BE(0);
        this.utxoIDs = [];
        for(let i = 0; i < numutxoIDs; i++) {
            let utxoid:UTXOID = new UTXOID();
            let offsetEnd:number = offset + utxoid.getSize();
            let copied:Buffer = bintools.copyFrom(bytes, offset, offsetEnd);
            utxoid.fromBuffer(copied);
            this.utxoIDs.push(utxoid);
            offset = offsetEnd;
        }
        let opid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.operation = SelectOperationClass(opid);
        return offset + this.operation.fromBuffer(bytes, offset);
    }

    toBuffer():Buffer {
        let bsize:number = this.assetid.length + this.numutxoIDs.length;
        let barr:Array<Buffer> = [this.assetid, this.numutxoIDs];
        for(let i = 0; i < this.utxoIDs.length; i++) {
            let b:Buffer = this.utxoIDs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        let opid:Buffer = Buffer.alloc(4);
        opid.writeUInt32BE(this.operation.getOperationID(), 0);
        barr.push(opid);
        bsize += opid.length;
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

    /**
     * Returns an array of UTXOIDs in this operation.
     */
    getUTXOIDs = ():Array<UTXOID> => {
        return this.utxoIDs;
    }
    
    /**
     * Returns the operation
     */
    getOperation = ():Operation => {
        return this.operation;
    }

    constructor(assetid:Buffer = undefined, utxoids:Array<UTXOID|string|Buffer> = undefined, operation:Operation = undefined) {
        if(
            typeof assetid !== 'undefined' && assetid.length == AVMConstants.ASSETIDLEN && 
            operation instanceof Operation && typeof utxoids !== 'undefined' && 
            Array.isArray(utxoids)
        ){
            this.assetid = assetid;
            this.operation = operation;
            for(let i = 0; i < utxoids.length; i++){
                let utxoid:UTXOID = new UTXOID(); 
                if(typeof utxoids[i] === 'string'){
                    utxoid.fromString(utxoids[i] as string);
                } else if(utxoids[i] instanceof Buffer){
                    utxoid.fromBuffer(utxoids[i] as Buffer);
                } else if(utxoids[i] instanceof UTXOID){
                    utxoid.fromString(utxoids[i].toString()); //clone
                } else {
                    throw new Error("Error - TransferableOperation.constructor: invalid utxoid in array parameter 'utxoids'");
                }
                this.utxoIDs.push(utxoid);
            }
        }
    }
}

/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
export class NFTTransferOperation extends Operation {
    protected sizeAddrIndecies:Buffer;
    protected addrIndecies:Array<number> = [];
    protected output:NFTTransferOutput;

    /**
     * Returns the operation ID.
     */
    getOperationID():number {
        return AVMConstants.NFTXFEROP;
    }

    /**
     * Returns the address  as a number.
     */
    getAddressIndecies = ():Array<number> => {
        return this.addrIndecies;
    }

    getOutput = ():NFTTransferOutput => {
        return this.output;
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the size of the output.
     */
    fromBuffer(opbuff:Buffer, offset:number = 0):number {
        this.sizeAddrIndecies = bintools.copyFrom(opbuff, offset, offset + 4);
        let sizeAddrIndecies:number = this.sizeAddrIndecies.readUInt32BE(0);
        offset += 4;
        for(let i:number = 0; i < sizeAddrIndecies; i++) {
            this.addrIndecies[i] = bintools.copyFrom(opbuff, offset, offset + 4).readUInt32BE(0);
            offset += 4;
        }
        return this.output.fromBuffer(opbuff, offset);
    }

    /**
     * Returns the buffer representing the [[NFTTransferOperation]] instance.
     */
    toBuffer():Buffer {
        this.addrIndecies.sort();
        let idxarr:Array<Buffer> = [];
        let s:number = 0;
        for(let i = 0; i < this.addrIndecies.length; i++) {
            let b:Buffer = Buffer.alloc(4);
            s += 4;
            b.readUInt32BE(this.addrIndecies[i]);
            idxarr.push(b)
        }
        let addrIdxs:Buffer = Buffer.concat(idxarr, s);
        let outbuff:Buffer = this.output.toBuffer();
        let bsize:number = this.sizeAddrIndecies.length + addrIdxs.length + outbuff.length;
        let barr:Array<Buffer> = [this.sizeAddrIndecies, addrIdxs, outbuff];
        return Buffer.concat(barr,bsize);
    }

    /**
     * Returns a base-58 string representing the [[NFTTransferOperation]].
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     * 
     * @param addressIndecies An array of numbers representing the indecies in the addresses array of the UTXO this operation is consuming 
     * @param output An [[NFTTransferOutput]]
     */
    constructor(addressIndecies:Array<number> = undefined, output:NFTTransferOutput = undefined){
        super()
        if(typeof addressIndecies !== 'undefined' && typeof output !== 'undefined'){
            this.addrIndecies = addressIndecies;
            this.output = output;
        }
    }
}

