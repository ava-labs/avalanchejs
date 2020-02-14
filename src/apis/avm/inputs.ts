/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { SigIdx, Constants } from './types';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Class representing an Input for a transaction.
 * 
 * @remarks 
 * Input:
 * ObjectID | 04 bytes
 * TxID     | 32 bytes
 * TxIndex  | 04 bytes
 * Amount   | 08 bytes
 * NumSigs  | 04 bytes
 * Repeated (NumSigs):
 *     SigIdx  | 04 bytes
 */

/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 * 
 * @param inbuffer A {@link https://github.com/feross/buffer|Buffer} containing the [[Input]] raw data.
 * 
 * @returns An instance of an [[Input]]-extended class: [[SecpInput]].
 */
export const SelectInputClass = (inbuffer:Buffer, args:Array<any> = []):Input => {
    let inputid:number = inbuffer.readUInt32BE(68);
    if(inputid == Constants.SECPINPUTID){
        let secpin:SecpInput = new SecpInput();
        secpin.fromBuffer(inbuffer);
        return secpin;
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectInputClass: unknown inputid " + inputid);
}

export class Input {
    protected txid:Buffer = Buffer.alloc(32);
    protected txidx:Buffer = Buffer.alloc(4);
    protected assetid:Buffer = Buffer.alloc(32);
    protected inputid:Buffer = Buffer.alloc(4);

    /**
     * Returns a function used to sort an array of [[Input]]s
     */
    static comparator = ():(a:Input, b:Input) => (1|-1|0) => {
        return function(a:Input, b:Input):(1|-1|0) { 
            return Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);
        }
    }

    /**
     * Returns a base-58 string representation of the UTXOID this [[Input]] references.
     */
    getUTXOID = ():string => {
        return bintools.bufferToB58(Buffer.concat([this.txid, this.txidx]));
    }

    /**
     * Returns the number for the input type of the output class.
     */
    getInputID = ():number => {
        return this.inputid.readUInt32BE(0);
    };

    /**
     * Returns the assetID of the input.
     */
    getAssetID = ():Buffer => {
        /* istanbul ignore next */
        return this.assetid;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Input]], parses it, populates the class, and returns the length of the Input in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Input]]
     * 
     * @returns The length of the raw [[Input]]
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.txidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.inputid = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Input]].
     */
    toBuffer():Buffer {
        try {
            let bsize:number = this.txid.length + this.txidx.length + this.assetid.length + this.inputid.length ;
            let barr:Array<Buffer> = [this.txid, this.txidx, this.assetid, this.inputid];
            let buff: Buffer = Buffer.concat(barr,bsize);
            return buff;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - Input.toBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 representation of the [[Input]].
     */
    toString():string {
        /* istanbul ignore next */
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Class representing an Input for a transaction.
     * 
     * @param txid A {@link https://github.com/feross/buffer|Buffer} containing the transaction ID of the referenced UTXO
     * @param txidx A {@link https://github.com/feross/buffer|Buffer} containing the index of the output in the transaction consumed in the [[Input]]
     * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Input]]
     * @param inputid A number representing the InputID of the [[Input]]
     */
    constructor(txid?:Buffer, txidx?:Buffer, assetID?:Buffer, inputid?:number) {
        if(txid && txidx && assetID && inputid){
            this.inputid.writeUInt32BE(inputid,0);
            this.txid = txid;
            this.txidx = txidx;
            this.assetid = assetID;
        }
    }
}


export class SecpInput extends Input {
    protected amount:Buffer = Buffer.alloc(8);
    protected amountValue:BN = new BN(0);
    protected numAddr:Buffer = Buffer.alloc(4);
    protected sigIdxs:Array<SigIdx> = []; // idxs of signers from utxo


    /**
     * Returns the array of [[SigIdx]] for this [[Input]] 
     */
    getSigIdxs = ():Array<SigIdx> => {
        return this.sigIdxs;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Input]], parses it, populates the class, and returns the length of the [[Input]] in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Input]]
     * 
     * @returns The length of the raw [[Input]]
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.amountValue = bintools.fromBufferToBN(this.amount);
        this.numAddr = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let numaddr:number = this.numAddr.readUInt32BE(0);
        this.sigIdxs = [];
        for(let i = 0; i < numaddr; i++){
            let sigidx = new SigIdx();
            let sigbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Input]].
     */
    toBuffer():Buffer {
        try {
            let basicin:Buffer = super.toBuffer();
            this.numAddr.writeUInt32BE(this.sigIdxs.length, 0);
            let bsize:number = basicin.length + this.amount.length + this.numAddr.length;
            let barr:Array<Buffer> = [basicin, this.amount, this.numAddr];
            for(let i = 0; i < this.sigIdxs.length; i++) {
                let b:Buffer = this.sigIdxs[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            return Buffer.concat(barr,bsize);
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - SecpInput.toBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 representation of the [[Input]].
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
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
        this.numAddr.writeUInt32BE(this.sigIdxs.length,0);
    }

    /**
     * Class representing an Input for a transaction.
     * 
     * @param txid A {@link https://github.com/feross/buffer|Buffer} containing the transaction ID of the referenced UTXO
     * @param txidx A {@link https://github.com/feross/buffer|Buffer} containing the index of the output in the transaction consumed in the [[Input]]
     * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Input]]
     * @param amount A {@link https://github.com/indutny/bn.js/|BN} containing the amount of the output to be consumed
     */
    constructor(txid?:Buffer, txidx?:Buffer, amount?:BN, assetID?:Buffer) {
        super(txid, txidx, assetID, Constants.SECPINPUTID);
        if(txid && txidx && amount && assetID){
            this.inputid.writeUInt32BE(Constants.SECPINPUTID,0);
            this.txid = txid;
            this.txidx = txidx;
            this.assetid = assetID;
            this.amountValue = amount;
            this.amount = bintools.fromBNToBuffer(amount, 8);
            this.sigIdxs = [];
        }
        
    }
}