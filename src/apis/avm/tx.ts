/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import { Signature, Constants } from './types';
import { Output, SelectOutputClass } from './outputs';
import { Input } from './inputs';
import BinTools from '../../utils/bintools';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/** 
 * Class representing an unsigned transaction.
 * 
 * @remarks
 * Unsigned Tx:
 * TxID      | 4 bytes
 * NetworkID  | 4 bytes
 * BlockchainID   | 32 bytes
 * NumOuts    | 4 bytes
 * Repeated (NumOuts):
 *     Out    | ? bytes
 * NumIns     | 4 bytes
 * Repeated (NumIns):
 *     In     | ? bytes
 */
/* Tx:
 * Unsigned Tx | ? bytes
 * Repeated (NumIns):
 *     Sig     | ? bytes
 */
/* Sig:
 * Repeated (NumSigs):
 *     Sig    | 65 bytes
 */
export class TxUnsigned {
    protected txtype:Buffer = Buffer.alloc(4);
    protected networkid:Buffer = Buffer.alloc(4);
    protected blockchainid:Buffer = Buffer.alloc(32);
    protected numouts:Buffer = Buffer.alloc(4);
    protected outs:Array<Output>;
    protected numins:Buffer = Buffer.alloc(4);
    protected ins:Array<Input>;

    /**
     * Returns the number representation of the txtype
     */
    getTxType = ():number => {
        return this.txtype.readUInt32BE(0);
    }

    /**
     * Returns the number representation of the NetworkID
     */
    getNetworkID = ():number => {
        return this.networkid.readUInt32BE(0);
    }

    /**
     * Returns the Buffer representation of the BlockchainID
     */
    getBlockchainID = ():Buffer => {
        return this.blockchainid;
    }
    
    /**
     * Returns the array of [[Input]]s
     */
    getIns = ():Array<Input> => {
        return this.ins;
    }

    /**
     * Returns the array of [[Output]]s
     */
    getOuts = ():Array<Output> => {
        return this.outs;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[TxUnsigned]], parses it, populates the class, and returns the length of the TxUnsigned in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TxUnsigned]]
     * 
     * @returns The length of the raw [[TxUnsigned]]
     * 
     * @remarks assume not-checksummed and deserialized
     */
    fromBuffer = (bytes:Buffer):number => {
        let offset:number = 0;
        this.txtype = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.blockchainid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let outcount:number = this.numouts.readUInt32BE(0);
        this.outs = [];
        for(let i = 0; i < outcount; i++){
            let outbuff:Buffer = bintools.copyFrom(bytes, offset, bytes.length);
            let out:Output = SelectOutputClass(outbuff);
            offset += out.fromBuffer(outbuff);
            this.outs.push(out);
        }
        this.numins = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let incount:number = this.numins.readUInt32BE(0);
        this.ins = [];
        for(let i = 0; i < incount; i++){
            let inbuff:Buffer = bintools.copyFrom(bytes, offset, bytes.length);
            let input:Input = new Input();
            offset += input.fromBuffer(inbuff);
            this.ins.push(input);
        }
        return offset;
    }

    /**
     * @ignore
     */
    protected _basicTxBuffer = ():Buffer => {
        try {
            this.outs.sort(Output.comparator());
            this.ins.sort(Input.comparator());
            this.numouts.writeUInt32BE(this.outs.length, 0);
            this.numins.writeUInt32BE(this.ins.length, 0);
            let bsize:number = this.txtype.length + this.networkid.length + this.blockchainid.length + this.numouts.length;
            let barr:Array<Buffer> = [this.txtype, this.networkid, this.blockchainid, this.numouts];
            for(let i = 0; i < this.outs.length; i++) {
                let b:Buffer = this.outs[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            barr.push(this.numins);
            bsize += this.numins.length;
            for(let i = 0; i < this.ins.length; i++) {
                let b:Buffer = this.ins[i].toBuffer();
                barr.push(b);
                bsize += b.length;
            }
            let buff:Buffer = Buffer.concat(barr, bsize);
            return buff;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - TxUnsigned._basicTxBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[TxUnsigned]].
     */
    toBuffer = ():Buffer => {
        return this._basicTxBuffer();
    }

    /**
     * Returns a base-58 representation of the [[TxUnsigned]].
     */
    toString = ():string => {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Class representing an unsigned transaction.
     * 
     * @param ins Optional array of the [[Input]]s
     * @param outs Optional array of the [[Output]]s
     * @param networkid Optional networkid, default 2
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param txtype Optional txtype, default 2
     */
    constructor(ins?:Array<Input>, outs?:Array<Output>, networkid:number = 2, blockchainid:Buffer = Buffer.alloc(32, 16), txtype:number = 0) {
        this.txtype.writeUInt32BE(txtype, 0);
        this.networkid.writeUInt32BE(networkid, 0);
        this.blockchainid = blockchainid;
        if(ins && outs){
            this.numouts.writeUInt32BE(outs.length, 0);
            this.outs = outs.sort(Output.comparator());
            this.numins.writeUInt32BE(ins.length, 0);
            this.ins = ins.sort(Input.comparator());
        }
    }
}

/**
 * Class representing a signed transaction.
 */
export class Tx {
    protected tx:TxUnsigned = new TxUnsigned();
    protected signatures:Array<Array<Signature>> = [];

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Tx]]
     * 
     * @returns The length of the raw [[Tx]]
     */
    fromBuffer = (bytes:Buffer):number => {
        this.tx = new TxUnsigned();
        let offset:number = this.tx.fromBuffer(bytes);
            let numcreds:number =   bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
            offset += 4;
            this.signatures = [];
            for(let i = 0; i < numcreds; i++){
                let sigarray:Array<Signature> = [];
                let credential:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
                if(credential != Constants.SECPCREDENTIAL){
                    throw new Error("Error - Tx.fromBuffer: Invalid credentialID " + credential);
                }
                let numsigs:number =   bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
                offset += 4;
                for(let j = 0; j  < numsigs; j++) {
                    let sig:Signature = new Signature();
                    sig.fromBuffer(bintools.copyFrom(bytes, offset, offset + 65));
                    sigarray.push(sig);
                    offset += 65;
                }
                this.signatures.push(sigarray);
            }
        return offset;
    }
    /**
     * Takes a base-58 string containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     * 
     * @param serialized A base-58 string containing a raw [[Tx]]
     * 
     * @returns The length of the raw [[Tx]]
     * 
     * @remarks 
     * unlike most fromStrings, it expects the string to be serialized in AVA format
     */
    fromString = (serialized:string):number => {
        return this.fromBuffer(bintools.avaDeserialize(serialized));
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Tx]].
     */
    toBuffer = ():Buffer => {
        try {
            let txbuff: Buffer = this.tx.toBuffer();
            let bsize:number = txbuff.length;
            let sigarrlen:Buffer = Buffer.alloc(4);
            sigarrlen.writeUInt32BE(this.signatures.length, 0);
            let barr:Array<Buffer> = [txbuff, sigarrlen];
            bsize += sigarrlen.length;
            for(let i = 0; i < this.signatures.length; i++){
                let siglen:Buffer = Buffer.alloc(4);
                siglen.writeUInt32BE(this.signatures[i].length, 0);
                let credentialID = Buffer.alloc(4);
                credentialID.writeUInt32BE(Constants.SECPCREDENTIAL, 0);
                barr.push(credentialID);
                bsize += credentialID.length;
                barr.push(siglen);
                bsize += siglen.length;
                for(let j = 0; j < this.signatures[i].length; j++){
                    let b:Buffer = this.signatures[i][j].toBuffer();
                    barr.push(b);
                    bsize += b.length;
                }
            }
            let buff:Buffer = Buffer.concat(barr, bsize);
            return buff;
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - TxSigned.toBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
    }

    /**
     * Returns a base-58 AVA-serialized representation of the [[Tx]].
     * 
     * @remarks 
     * unlike most toStrings, this returns in AVA serialization format
     */
    toString = ():string => {
        return bintools.avaSerialize(this.toBuffer());
    }

    /**
     * Class representing a signed transaction.
     * 
     * @param tx Optional [[Tx]]
     * @param signatures Optional array of [[Signature]]s
     */
    constructor(tx?:TxUnsigned, signatures?:Array<Array<Signature>>) {
        if(tx){
            this.tx = tx;
            if(signatures){
                this.signatures = signatures
            }
        }
    }
}


