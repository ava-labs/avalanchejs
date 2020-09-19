/**
 * @packageDocumentation
 * @module API-AVM-MinterSet
 */

import { Buffer } from "buffer/";
import BinTools  from '../../utils/bintools';
import { Serializable, Serialization, SerializedEncoding } from '../../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Class for representing a threshold and set of minting addresses in Avalanche. 
 * 
 * @typeparam MinterSet including a threshold and array of addresses
 */
export class MinterSet extends Serializable{
    protected _typeName = "MinterSet";
    protected _typeID = undefined;

    serialize(encoding:SerializedEncoding = "hex"):object {
        let fields:object = super.serialize(encoding);
        return {
            ...fields,
            "threshold": serializer.encoder(this.threshold, encoding, "number", "decimalString", 4),
            "minters": this.minters.map((m) => serializer.encoder(m, encoding, "Buffer", "cb58", 20))
        }
    };
    deserialize(fields:object, encoding:SerializedEncoding = "hex") {
        super.deserialize(fields, encoding);
        this.threshold = serializer.decoder(fields["threshold"], encoding, "decimalString", "number", 4);
        this.minters = fields["minters"].map((m:string) => serializer.decoder(m, encoding, "cb58", "Buffer", 20));
    }
  
    protected threshold:number;
    protected minters:Array<Buffer> = [];

    /**
     * Returns the threshold.
     */
    getThreshold = ():number => {
        return this.threshold;
    }

    /**
     * Returns the minters.
     */
    getMinters = ():Array<Buffer> => {
        return this.minters;
    }

    protected  _cleanAddresses = (addresses:Array<string|Buffer>):Array<Buffer> => {
        let addrs:Array<Buffer> = [];
        for(let i:number = 0; i < addresses.length; i++) {
            if(typeof addresses[i] === "string") {
                addrs.push(bintools.stringToAddress(addresses[i] as string));
            } else if(addresses[i] instanceof Buffer) {
                addrs.push(addresses[i] as Buffer);
            }
        }
        return addrs;
    }

    /**
     * 
     * @param threshold The number of signatures required to mint more of an asset by signing a minting transaction
     * @param minters Array of addresss which are authorized to sign a minting transaction
     */
    constructor(threshold:number, minters:Array<string|Buffer>) {
        super();
        this.threshold = threshold;
        this.minters = this._cleanAddresses(minters);
    }
}