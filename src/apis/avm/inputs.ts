/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { SigIdx } from './types';

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
export class Input {
    protected id:Buffer = Buffer.alloc(4);
    protected txid:Buffer = Buffer.alloc(32);
    protected txidx:Buffer = Buffer.alloc(4);
    protected assetid:Buffer = Buffer.alloc(32);
    protected amount:Buffer = Buffer.alloc(8);
    protected amountValue:BN = new BN(0);
    protected numAddr:Buffer = Buffer.alloc(4);
    protected sigIdxs:Array<SigIdx> = []; // idxs of signers from utxo

    /**
     * Returns a function used to sort an array of [[Input]]s
     */
    static comparitor = ():(a:Input, b:Input) => (1|-1|0) => {
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
     * Returns the array of [[SigIdx]] for this [[Input]] 
     */
    getSigIdxs = ():Array<SigIdx> => {
        return this.sigIdxs;
    }

    /**
     * Returns the number for the input type of the output class.
     */
    getInputType = ():number => {
        return this.id.readUInt32BE(0);
    };

    /**
     * Returns the assetID of the input.
     */
    getAssetID = ():Buffer => {
        return this.assetid;
    }

    /**
     * @ignore
     */
    protected _basicTxInBuffer = (): Buffer => {
        try {
            this.numAddr.writeUInt32BE(this.sigIdxs.length, 0);
            let bsize:number = this.id.length + this.txid.length + this.txidx.length + this.assetid.length + this.amount.length + this.numAddr.length;
            let barr:Array<Buffer> = [this.id, this.txid, this.txidx, this.assetid, this.amount, this.numAddr];
            for(let i = 0; i < this.sigIdxs.length; i++) {
                let b:Buffer = this.sigIdxs[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            let buff: Buffer = Buffer.concat(barr,bsize);
            return buff;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - TxOut._basicTxBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Input]], parses it, populates the class, and returns the length of the Input in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Input]]
     * 
     * @returns The length of the raw [[Input]]
     */
    fromBuffer = (bytes:Buffer):number => {
        let offset:number = 0;
        this.id = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.txidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.amount = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.amountValue = bintools.fromBufferToBN(this.amount);
        this.numAddr = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let numaddr:number = this.numAddr.readUInt32BE(0);
        this.sigIdxs = [];
        for(let i = 0; i < numaddr; i++){
            let sigidx = new SigIdx();
            sigidx.fromBuffer(bintools.copyFrom(bytes, offset, offset + 4));
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Input]].
     */
    toBuffer = ():Buffer => {
        return this._basicTxInBuffer();
    }

    /**
     * Returns a base-58 representation of the [[Input]].
     */
    toString = ():string => {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Creates and adds a [[SigIdx]] to the [[Input]].
     * 
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx = (addressIdx:number, address:string) => {
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
        if(txid && txidx && amount && assetID){
            this.id.writeUInt32BE(0,0);
            this.txid = txid;
            this.txidx = txidx;
            this.assetid = assetID;
            this.amountValue = amount;
            this.amount = bintools.fromBNToBuffer(amount, 8);
            this.sigIdxs = [];
        }
        
    }
}