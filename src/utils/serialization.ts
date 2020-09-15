/**
 * @packageDocumentation
 * @module Utils-Serialization
 */
import BinTools from '../utils/bintools';
import BN from 'bn.js';
import { Buffer } from 'buffer/';

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

export abstract class Serializable {
    protected type:string = undefined;
    protected typeID:number = undefined;

    //sometimes the parent class manages the fields
    //these are so you can say super.getFields(); 
    abstract getFields(encoding?:string):object; 
    abstract setFields(fields:object, encoding:string);

    abstract deserialize(obj:object, encoding?:string):this;

    abstract serialize(encoding?:string):string;
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

    stringToHex(v:string):string {
        let out:string = undefined;
        if(this.bintools.isPrimaryBechAddress(v)){
            out = this.bintools.stringToAddress(v).toString("hex");
        } else if(this.bintools.isHex(v)){
            out = v;
        } else if(this.bintools.isBase58(v)){
            let vbuff:Buffer = this.bintools.b58ToBuffer(v);
            if(this.bintools.validateChecksum(vbuff)){
                out = this.bintools.cb58Decode(vbuff).toString("hex")
            } else {
                out = vbuff.toString("hex");
            }
        } else if(this.bintools.isBase64(v)){
            out = atob(v);
        } else if(this.bintools.isDecimal(v)) {
            out = new BN(v, 10).toString("hex");
        } else {
            const buff:Buffer = Buffer.alloc(v.length);
            buff.write(v, 0, v.length, 'utf8');
            out = buff.toString("hex");
        }
        return out.startsWith("0x") ? out.slice(2) : out;
    }

    encoder(v:any, enc:"hex"|"native", type:SerializedType,  hrp?:string, chainid?:string):string {
        if(enc === "hex") {
            if(v instanceof BN) {
                return v.toString("hex");
            } else if(v instanceof Buffer) {
                return v.toString("hex");
            } else if(typeof v === "string") {
                return this.stringToHex(v);
            } else if(typeof v === "number") {
                let x = v.toString(16);
                return x.startsWith("0x") ? x.slice(2) : x
            }
        } else if(enc === "native") {
            if(v instanceof BN) {
                return v.toString(10);
            } else if(v instanceof Buffer) {
                return this.bufferToType(v, type, hrp, chainid) as string;
            } else if(typeof v === "string") {
               return v;
            } else if(typeof v === "number") {
                return v.toString();
            }
        }
        return undefined;
    }

    bufferToType(vb:Buffer, type:SerializedType, hrp?:string, chainid?:string):any {
        if(type === "BN") {
            return new BN(vb.toString("hex"), "hex");
        } else if(type === "Buffer") {
            return vb;
        } else if(type === "Bech32") {
            return this.bintools.addressToString(hrp, chainid, vb);
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

    decoder(v:string, enc:"hex"|"native", type:SerializedType,  hrp?:string, chainid?:string):any {
        if(enc === "hex") {
            let vb:Buffer = Buffer.from(v, "hex");
            return this.bufferToType(vb, enc, hrp, chainid);
        } else if(enc === "native") {
            if(type === "BN") {
                return new BN(v, 10);
            } else if(
                type === "Buffer" ||
                type === "Bech32" ||
                type === "cb58" ||
                type === "base58" ||
                type === "base64" ||
                type === "hex" ) 
            {
                return this.bufferToType(Buffer.from(this.stringToHex(v), "hex"), type, hrp, chainid);
            } else if(
                type === "decimalString" ||
                type === "utf8" ) 
            {
                return v;
            } else if(type === "number") {
                return new BN(v, 10).toNumber();
            } else if(type === "utf8") {
                return v;
            }
        }
        return undefined;
    }

    format(type:string, fields:object, typeid:number = undefined):object {
        let obj:object = {
            "type": type,
            "fields": fields
        }
        if(typeof typeid === "number") {
            obj["typeID"] = typeid;
        }
        return obj;
    }

}