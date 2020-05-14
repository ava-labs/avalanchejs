/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import { UTXOID, AVMConstants, SigIdx } from './types';
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
    protected sigCount:Buffer = Buffer.alloc(4);
    protected sigIdxs:Array<SigIdx> = []; // idxs of signers from utxo

    abstract getOperationID():number;

    /**
     * Returns the array of [[SigIdx]] for this [[Operation]] 
     */
    getSigIdxs = ():Array<SigIdx> => {
        return this.sigIdxs;
    }

    /**
     * Creates and adds a [[SigIdx]] to the [[Operation]].
     * 
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx = (addressIdx:number, address:Buffer) => {
        let sigidx:SigIdx = new SigIdx();
        let b:Buffer = Buffer.alloc(4);
        b.writeUInt32BE(addressIdx, 0);
        sigidx.fromBuffer(b);
        sigidx.setSource(address);
        this.sigIdxs.push(sigidx);
        this.sigCount.writeUInt32BE(this.sigIdxs.length,0);
    }

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let sigCount:number = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for(let i:number = 0; i < sigCount; i++) {
            let sigidx:SigIdx = new SigIdx();
            let sigbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx)
        }
        return offset;
    }

    toBuffer():Buffer {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize:number = this.sigCount.length;
        let barr:Array<Buffer> = [this.sigCount];
        for(let i = 0; i < this.sigIdxs.length; i++) {
            let b:Buffer = this.sigIdxs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return Buffer.concat(barr,bsize);
    }

    static comparator = ():(a:Operation, b:Operation) => (1|-1|0) => {
        return function(a:Operation, b:Operation):(1|-1|0) { 
            let aoutid:Buffer = Buffer.alloc(4);
            aoutid.writeUInt32BE(a.getOperationID(), 0);
            let abuff:Buffer = a.toBuffer();

            let boutid:Buffer = Buffer.alloc(4);
            boutid.writeUInt32BE(b.getOperationID(), 0);
            let bbuff:Buffer = b.toBuffer();

            let asort:Buffer = Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
            let bsort:Buffer = Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
            return Buffer.compare(asort, bsort) as (1|-1|0);
        }
    }

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
    protected output:NFTTransferOutput;

    /**
     * Returns the operation ID.
     */
    getOperationID():number {
        return AVMConstants.NFTXFEROP;
    }

    getOutput = ():NFTTransferOutput => {
        return this.output;
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the size of the output.
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        return this.output.fromBuffer(bytes, offset);
    }

    /**
     * Returns the buffer representing the [[NFTTransferOperation]] instance.
     */
    toBuffer():Buffer {
        let outbuff:Buffer = this.output.toBuffer();
        let superbuff:Buffer = super.toBuffer();
        let bsize:number = superbuff.length + outbuff.length;
        let barr:Array<Buffer> = [superbuff, outbuff];
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
     * @param addressIndecies An array of numbers representing the indecies in the addresses array of the [[UTXO]] this operation is consuming 
     * @param output An [[NFTTransferOutput]]
     */
    constructor(output:NFTTransferOutput = undefined){
        super()
        if( typeof output !== 'undefined'){
            this.output = output;
        }
    }
}

