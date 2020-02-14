/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import { NBytes } from '../../utils/types';
import BN from "bn.js";
import BinTools from '../../utils/bintools';
import { Output, SelectOutputClass, SecpOutBase } from './outputs';

/**
 * @ignore
 */
let bintools:BinTools = BinTools.getInstance();

/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
export class SigIdx extends NBytes {
    source:Buffer;

    /**
     * Sets the source address for the signature
     */
    setSource = (address:Buffer) => {
        this.source = address;
    }

    /**
     * Retrieves the source address for the signature
     */
    getSource = ():Buffer => {
        return this.source;
    }

    /**
     * Type representing a [[Signature]] index used in [[Input]]
     */
    constructor(){
        super();
        this.bytes = Buffer.alloc(4);
        this.bsize = 4;
    }
}

/**
 * Signature for a [[Tx]]
 */
export class Signature extends NBytes {

    /**
     * Signature for a [[Tx]]
     */
    constructor(){
        super();
        this.bytes = Buffer.alloc(65);
        this.bsize = 65;
    }
}

/**
 * Class for representing an address used in [[Output]] types
 */
export class Address extends NBytes {

    /**
     * Returns a function used to sort an array of [[Address]]es
     */
    static comparitor = ():(a:Address, b:Address) => (1|-1|0) => {
        return function(a:Address, b:Address):(1|-1|0) { 
            return Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);
        }
    }
    /**
     * Returns a base-58 representation of the [[Address]].
     */
    toString():string {
        return bintools.avaSerialize(this.toBuffer());
    }
    /**
     * Takes a base-58 string containing an [[Address]], parses it, populates the class, and returns the length of the Address in bytes.
     * 
     * @param bytes A base-58 string containing a raw [[Address]]
     * 
     * @returns The length of the raw [[Address]]
     */
    fromString(addr:string):number {
        let addrbuff:Buffer = bintools.b58ToBuffer(addr);
        if(addrbuff.length == 24 && bintools.validateChecksum(addrbuff)) {
            let newbuff:Buffer = bintools.copyFrom(addrbuff, 0,addrbuff.length - 4);
            if(newbuff.length == 20){
                this.bytes = newbuff;
            }
        } else if(addrbuff.length == 24){
            throw new Error("Error - Address.fromString: invalid checksum on address");
        } else if(addrbuff.length == 20){
            this.bytes = addrbuff;
        } else {
            /* istanbul ignore next */
            throw new Error("Error - Address.fromString: invalid address");
        }
        return this.getSize();
    }

    /**
     * Class for representing an address used in [[Output]] types
     */
    constructor(){
        super();
        this.bytes = Buffer.alloc(20);
        this.bsize = 20;
    }
}

export class InitialStates {
    protected fxs:{[fxid:number]:Array<Output>} = {};

    addOutput(out:Output, fxid:number):void {
        if(!(fxid in this.fxs)){
            this.fxs[fxid] = [];
        }
        this.fxs[fxid].push(out);
    }

    fromBuffer(bytes:Buffer, offset:number):number {
        let result:{[fxid:number]:Array<Output>} = {};
        let klen:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let klennum:number = klen.readUInt32BE(0);
        for(let i = 0; i < klennum; i++){
            let fxidbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
            offset += 4;
            let fxid:number = fxidbuff.readUInt32BE(0);
            result[fxid] = [];
            let statelenbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
            offset += 4;
            let statelen:number = statelenbuff.readUInt32BE(0);
            for(let j = 0; j < statelen; j++){
                let abuff:Buffer = bintools.copyFrom(bytes, offset);
                let out:Output = new SecpOutBase();
                out.fromBuffer(abuff)
                let outbuff:Buffer = out.toBuffer();
                offset += outbuff.length;
                result[fxid].push(out);
            }
        }
        this.fxs = result;
        return offset
    }

    toBuffer():Buffer {
        let buff:Array<Buffer> = [];
        let keys:Array<number> = Object.keys(this.fxs).map(k => parseInt(k)).sort();
        let klen:Buffer = Buffer.alloc(4);
        klen.writeUInt32BE(keys.length, 0);
        buff.push(klen);
        for(let i = 0; i < keys.length; i++){
            let fxid:number = keys[i];
            let fxidbuff:Buffer = Buffer.alloc(4);
            fxidbuff.writeUInt32BE(fxid, 0);
            buff.push(fxidbuff);
            let initialState = this.fxs[fxid].sort(Output.comparator());
            let statelen:Buffer = Buffer.alloc(4);
            statelen.writeUInt32BE(initialState.length, 0);
            buff.push(statelen);
            for(let j = 0; j < initialState.length; j++){
                buff.push(initialState[j].toBuffer());
            }
        }
        return Buffer.concat(buff);
    }
    constructor(){}
}

export class AVMConstants {
    static SECPOUTPUTID:number = 4;
    static SECPINPUTID:number = 6;
    static CREATEASSETTX:number = 1;
    static BASETX:number = 0;
    static SECPCREDENTIAL:number = 7;
    static ASSETIDLEN:number = 32;
    static BLOCKCHAINIDLEN:number = 32;
    static SYMBOLMAXLEN:number = 4;
    static ASSETNAMELEN:number = 128;
    static ADDRESSLENGTH:number = 20;
    static SECPFXID:number = 0;
}

/**
 * Rules used when merging sets
 */
export type MergeRule = "intersection" //Self INTERSECT New 
                        | "differenceSelf" //Self MINUS New
                        | "differenceNew" //New MINUS Self
                        | "symDifference" //differenceSelf UNION differenceNew
                        | "union" //Self UNION New
                        | "unionMinusNew" //union MINUS differenceNew
                        | "unionMinusSelf" //union MINUS differenceSelf
                        | "ERROR"; //generate error for testing

/**
 * Function providing the current UNIX time using a {@link https://github.com/indutny/bn.js/|BN}
 */
export function UnixNow():BN {
    return new BN(Math.round((new Date()).getTime() / 1000));
};