/**
 * @packageDocumentation
 * @module Utils-Serialization
 */
import BinTools from '../utils/bintools';
import BN from 'bn.js';
import { Buffer } from 'buffer/';

export const SERIALIZATIONVERSION = 1;

export type SerializedType = 
  'hex' 
| 'BN' 
| 'Buffer' 
| 'Bech32' 
| 'cb58' 
| 'base58' 
| 'base64' 
| 'decimalString'
| 'number'
| 'utf8'
;

export type SerializedEncoding = 
  'hex' 
| 'cb58' 
| 'base58' 
| 'base64' 
| 'decimalString'
| 'number'
| 'utf8'
| 'display'
;

export abstract class Serializable {
    protected type:string = undefined;
    protected typeID:number = undefined;

    //sometimes the parent class manages the fields
    //these are so you can say super.serialize(); 
    abstract serialize(encoding?:SerializedEncoding):object; 
    abstract deserialize(fields:object, encoding?:SerializedEncoding);
}

export class Serialization {
    private static instance:Serialization;
  
    private constructor() {
      this.bintools = BinTools.getInstance();
    }
    private bintools:BinTools;

    /**
     * Retrieves the Serialization singleton.
     */
    static getInstance(): Serialization {
        if (!Serialization.instance) {
            Serialization.instance = new Serialization();
        }
        return Serialization.instance;
    }

    bufferToType(vb:Buffer, type:SerializedType, ...args:Array<any>):any {
        if(type === "BN") {
            return new BN(vb.toString("hex"), "hex");
        } else if(type === "Buffer") {
            return vb;
        } else if(type === "Bech32") {
            return this.bintools.addressToString(args[0], args[1], vb);
        } else if(type === "cb58") {
            return this.bintools.cb58Encode(vb);
        } else if(type === "base58") {
            return this.bintools.bufferToB58(vb);
        } else if(type === "base64") {
            return vb.toString("base64");
        } else if(type === "hex") {
            return vb.toString("hex");
        } else if(type === "decimalString") {
            return new BN(vb.toString("hex"), "hex").toString(10);
        } else if(type === "number") {
            return new BN(vb.toString("hex"), "hex").toNumber();
        } else if(type === "utf8") {
            return vb.toString("utf8");
        }
        return undefined;
    }

    typeToBuffer(v:any, type:SerializedType, ...args:Array<any>):any {
        if(type === "BN") {
            let str:string = (v as BN).toString("hex");
            if(args.length > 0 && typeof args[0] === "number"){
               return Buffer.from(str.padStart(args[0], '0'), 'hex'); 
            }
            return Buffer.from(str, 'hex'); 
        } else if(type === "Buffer") {
            return v;
        } else if(type === "Bech32") {
            return this.bintools.stringToAddress(v);
        } else if(type === "cb58") {
            return this.bintools.cb58Decode(v);
        } else if(type === "base58") {
            return this.bintools.b58ToBuffer(v);
        } else if(type === "base64") {
            return Buffer.from(v as string, "base64");
        } else if(type === "hex") {
            return Buffer.from(v as string, "hex");
        } else if(type === "decimalString") {
            let str:string = new BN(v as string, 10).toString("hex");
            if(args.length > 0 && typeof args[0] === "number"){
                return Buffer.from(str.padStart(args[0], '0'), 'hex');
            }
            return Buffer.from(str, 'hex');
        } else if(type === "number") {
            let str:string = new BN(v).toString("hex");
            if(args.length > 0 && typeof args[0] === "number"){
                return Buffer.from(str.padStart(args[0], '0'), 'hex');
            }
            return Buffer.from(str, 'hex');
        } else if(type === "utf8") {
            if(args.length > 0 && typeof args[0] === "number"){
                let b:Buffer = Buffer.alloc(args[0]);
                return b.copy(Buffer.from(v, 'utf8'), 0);
            }
            return Buffer.from(v, 'utf8');
        }
        return undefined;
    }

    encoder(value:any, encoding:SerializedEncoding, intype:SerializedType, outtype:SerializedType, ...args:Array<any>):string {
        if(encoding !== "display"){
            outtype = encoding;
        }
        let vb:Buffer = this.typeToBuffer(value, intype, ...args);
        return this.bufferToType(vb, outtype, ...args);
    }


    decoder(value:string, encoding:SerializedEncoding, intype:SerializedType, outtype:SerializedType, ...args:Array<any>):any {
        if(encoding !== "display") {
            intype = encoding;
        } 
        let vb:Buffer = this.typeToBuffer(value, intype, ...args);
        return this.bufferToType(vb, outtype, ...args);
    }

    format(fields:object, type:string, typeID:number = undefined):object {
        fields["type"] = type;
        if(typeof typeID === "number") {
            fields["typeID"] = typeID;
        }
        return fields;
    }

    addSpecification(fields:object, vm:string, encoding:SerializedEncoding):object {
        return {
            vm,
            encoding,
            version: SERIALIZATIONVERSION,
            fields
        }
    }
}