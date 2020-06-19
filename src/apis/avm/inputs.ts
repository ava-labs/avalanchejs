/**
 * @packageDocumentation
 * @module AVMAPI-Inputs
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { SigIdx, AVMConstants } from './types';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 * 
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 * 
 * @returns An instance of an [[Input]]-extended class.
 */
export const SelectInputClass = (inputid:number, ...args:Array<any>):Input => {
    if(inputid == AVMConstants.SECPINPUTID){
        let secpin:SecpInput = new SecpInput(...args);
        return secpin;
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectInputClass: unknown inputid " + inputid);
}

export abstract class Input {
    protected sigCount:Buffer = Buffer.alloc(4);
    protected sigIdxs:Array<SigIdx> = []; // idxs of signers from utxo

    abstract getInputID():number;

    /**
     * Returns the array of [[SigIdx]] for this [[Input]] 
     */
    getSigIdxs = ():Array<SigIdx> => {
        return this.sigIdxs;
    }

    getCredentialID = ():number => {
        return AVMConstants.SECPCREDENTIAL;
    }

    /**
     * Creates and adds a [[SigIdx]] to the [[Input]].
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
        for(let i = 0; i < sigCount; i++){
            let sigidx = new SigIdx();
            let sigbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
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

    /**
     * Returns a base-58 representation of the [[Input]].
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
    }

    static comparator = ():(a:Input, b:Input) => (1|-1|0) => {
        return function(a:Input, b:Input):(1|-1|0) { 
            let aoutid:Buffer = Buffer.alloc(4);
            aoutid.writeUInt32BE(a.getInputID(), 0);
            let abuff:Buffer = a.toBuffer();

            let boutid:Buffer = Buffer.alloc(4);
            boutid.writeUInt32BE(b.getInputID(), 0);
            let bbuff:Buffer = b.toBuffer();

            let asort:Buffer = Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
            let bsort:Buffer = Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
            return Buffer.compare(asort, bsort) as (1|-1|0);
        }
    }

    constructor(){};

}

export class TransferableInput {
    protected txid:Buffer = Buffer.alloc(32);
    protected outputidx:Buffer = Buffer.alloc(4);
    protected assetid:Buffer = Buffer.alloc(32);
    protected input:Input;

    /**
     * Returns a function used to sort an array of [[TransferableInput]]s
     */
    static comparator = ():(a:TransferableInput, b:TransferableInput) => (1|-1|0) => {
        return function(a:TransferableInput, b:TransferableInput):(1|-1|0) { 
            let sorta = Buffer.concat([a.getTxID(), a.getOutputIdx()]);
            let sortb = Buffer.concat([b.getTxID(), b.getOutputIdx()]);
            return Buffer.compare(sorta, sortb) as (1|-1|0);
        }
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
     */
    getTxID = ():Buffer => {
        /* istanbul ignore next */
        return this.txid;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
     */
    getOutputIdx = ():Buffer => {
        /* istanbul ignore next */
        return this.outputidx;
    }

    /**
     * Returns a base-58 string representation of the UTXOID this [[TransferableInput]] references.
     */
    getUTXOID = ():string => {
        return bintools.bufferToB58(Buffer.concat([this.txid, this.outputidx]));
    }

    /**
     * Returns the input.
     */
    getInput = ():Input => {
        return this.input;
    };

    /**
     * Returns the assetID of the input.
     */
    getAssetID = ():Buffer => {
        return this.assetid;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[TransferableInput]], parses it, populates the class, and returns the length of the [[TransferableInput]] in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TransferableInput]]
     * 
     * @returns The length of the raw [[TransferableInput]]
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(bytes, offset, offset + AVMConstants.ASSETIDLEN);
        offset += 32;
        let inputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.input = SelectInputClass(inputid);
        return this.input.fromBuffer(bytes, offset);
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[TransferableInput]].
     */
    toBuffer():Buffer {
        let inbuff:Buffer = this.input.toBuffer();
        let inputid:Buffer = Buffer.alloc(4);
        inputid.writeInt32BE(this.input.getInputID(), 0);
        let bsize:number = this.txid.length + this.outputidx.length + this.assetid.length + inputid.length + inbuff.length ;
        let barr:Array<Buffer> = [this.txid, this.outputidx, this.assetid, inputid, inbuff];
        let buff: Buffer = Buffer.concat(barr,bsize);
        return buff;
    }

    /**
     * Returns a base-58 representation of the [[TransferableInput]].
     */
    toString():string {
        /* istanbul ignore next */
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Class representing an [[TransferableInput]] for a transaction.
     * 
     * @param txid A {@link https://github.com/feross/buffer|Buffer} containing the transaction ID of the referenced UTXO
     * @param outputidx A {@link https://github.com/feross/buffer|Buffer} containing the index of the output in the transaction consumed in the [[TransferableInput]]
     * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Input]]
     * @param input An [[Input]] to be made transferable
     */
    constructor(txid:Buffer = undefined, outputidx:Buffer = undefined, assetID:Buffer = undefined, input:Input = undefined) {
        if(typeof txid !== 'undefined' && typeof outputidx !== 'undefined' && typeof assetID !== 'undefined' && input instanceof Input){
            this.input = input;
            this.txid = txid;
            this.outputidx = outputidx;
            this.assetid = assetID;
        }
    }
}

/**
 * An [[Input]] class which specifies a token amount .
 */
export abstract class AmountInput extends Input {
    protected amount:Buffer = Buffer.alloc(8);
    protected amountValue:BN = new BN(0);

    /**
     * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getAmount = ():BN => {
        return this.amountValue.clone();
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[AmountInput]] and returns the size of the output.
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        this.amountValue = bintools.fromBufferToBN(this.amount);
        offset += 8;
        return super.fromBuffer(bytes, offset);
    }

    /**
     * Returns the buffer representing the [[AmountInput]] instance.
     */
    toBuffer():Buffer {
        let superbuff:Buffer = super.toBuffer();
        let bsize:number = this.amount.length + superbuff.length;
        let barr:Array<Buffer> = [this.amount,superbuff];
        return Buffer.concat(barr,bsize);
    }

    /**
     * An [[AmountInput]] class which issues a payment on an assetID.
     * 
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
     */
    constructor(amount:BN = undefined) {
        super();
        if(amount) {
            this.amountValue = amount.clone();
            this.amount = bintools.fromBNToBuffer(amount, 8);
        }
    }
}

export class SecpInput extends AmountInput {
    /**
     * Returns the inputID for this input
     */
    getInputID():number {
        return AVMConstants.SECPINPUTID;
    }
}