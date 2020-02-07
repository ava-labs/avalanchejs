/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import { NBytes } from '../../utils/types';
import BN from "bn.js";
import BinTools from '../../utils/bintools';

/**
 * @ignore
 */
let bintools:BinTools = BinTools.getInstance();

/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
export class SigIdx extends NBytes {
    source:string;

    /**
     * Sets the source address for the signature
     */
    setSource = (address:string) => {
        this.source = address;
    }

    /**
     * Retrieves the source address for the signature
     */
    getSource = ():string => {
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

export class Constants {
    static SECPOUTPUTID:number = 4;
    static SECPINPUTID:number = 6;
    static CREATEASSETTX:number = 1;
    static BASETX:number = 0;
    static SECPCREDENTIAL:number = 7;
    static ASSETIDLEN:number = 32;
    static BLOCKCHAINIDLEN:number = 32;
    static SYMBOLMAXLEN:number = 4;
    static ASSETNAMELEN:number = 128;
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