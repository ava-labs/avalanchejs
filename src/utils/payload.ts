/**
 * @packageDocumentation
 * @module Payload
 */

import { Buffer } from "buffer/";
import BinTools  from './bintools';
import BN from "bn.js";

/**

    // the basic
    static BIN:number = 0;
    //formatted output types
    static UTF8:number = 1;
    static HEXSTR:number = 2;
    static B58STR:number = 3;
    static B64STR:number = 4;
    static BIGNUM:number = 5;
    //avalanche types
    static XCHAINADDR:number = 6;
    static PCHAINADDR:number = 7;
    static CCHAINADDR:number = 8;
    static TXID:number = 9;
    static ASSETID:number = 10;
    static UTXOID:number = 11;
    static NFTID:number = 12;
    static SUBNETID:number = 13;
    static CHAINID:number = 14;
    static NODEID:number = 15;
    static SECPSIG:number = 16; // convention: secp256k1 signature (130 bytes)
    static SECPENC:number = 17; // convention: public key (65 bytes) + secp256k1 encrypted message for that public key
    //image types
    static JPEG:number = 18; //note, we're not handling creation or conversion
    static PNG:number = 19; //note, we're not handling creation or conversion
    static BMP:number = 20; //note, we're not handling creation or conversion
    static ICO:number = 21; //note, we're not handling creation or conversion
    static SVG:number = 22; //note, we're not handling creation or conversion
    //text file types
    static CSV:number = 23; //note, we're not handling creation or conversion
    static JSON:number = 24; 
    static PROTOBUF:number = 25; //note, we're not handling creation or conversion
    static YAML:number = 26; //note, we're not handling creation or conversion
    //resolved types
    static EMAIL:number = 27;
    static URL:number = 28;
    static IPFS:number = 29;
    static ONION:number = 30;
    static MAGNET:number = 30;
    // 0x1F, next index 0x20

 */

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

export class PayloadTypes {

    private static instance: PayloadTypes;
    protected types:Array<string> = [];

    lookupID(typestr:string) {
        return this.types.indexOf(typestr);
    }

    lookupType(value:number):string {
        return this.types[value];
    }

    recast(unknowPayload:PayloadBase):PayloadBase {
        let retType:PayloadBase;
        switch(unknowPayload.typeID()) {
            case 0:
                retType = new BINPayload();
                break;
            case 1:
                retType = new UTF8Payload();
                break;
            case 2:
                retType = new HEXSTRPayload();
                break;
            case 3:
                retType = new B58STRPayload();
                break;
            case 4:
                retType = new B64STRPayload();
                break;
            case 5:
                retType = new BIGNUMPayload();
                break;
            case 6:
                retType = new XCHAINPayload();
                break;
            case 7:
                retType = new PCHAINPayload();
                break;
            case 8:
                retType = new CCHAINPayload();
                break;
            case 9:
                retType = new TXIDPayload();
                break;
            case 10:
                retType = new ASSETIDPayload();
                break;
            case 11:
                retType = new UTXOIDPayload();
                break;
            case 12:
                retType = new NFTIDPayload();
                break;
            case 13:
                retType = new SUBNETIDPayload();
                break;
            case 14:
                retType = new CHAINIDPayload();
                break;
            case 15:
                retType = new NODEIDPayload();
                break;
            case 16:
                retType = new SECPSIGPayload();
                break;
            case 17:
                retType = new SECPENCPayload();
                break;
            case 18:
                retType = new JPEGPayload();
                break;
            case 19:
                retType = new PNGPayload();
                break;
            case 20:
                retType = new BMPPayload();
                break;
            case 21:
                retType = new ICOPayload();
                break;
            case 22:
                retType = new SVGPayload();
                break;
            case 23:
                retType = new CSVPayload();
                break;
            case 24:
                retType = new JSONPayload();
                break;
            case 25:
                retType = new PROTOBUFPayload();
                break;
            case 26:
                retType = new YAMLPayload();
                break;
            case 27:
                retType = new EMAILPayload();
                break;
            case 28:
                retType = new URLPayload();
                break;
            case 29:
                retType = new IPFSPayload();
                break;
            case 30:
                retType = new ONIONPayload();
                break;
            case 31:
                retType = new MAGNETPayload();
                break;
        }
        retType.fromBuffer(unknowPayload.toBuffer());
        return retType;
    }

    static getInstance(): PayloadTypes {
        if (!PayloadTypes.instance) {
            PayloadTypes.instance = new PayloadTypes();
        }
    
        return PayloadTypes.instance;
      }

    private constructor() {
        this.types = [
            "BIN", "UTF8", "HEXSTR", "B58STR", "B64STR", "BIGNUM", "XCHAINADDR", "PCHAINADDR", "CCHAINADDR", "TXID", 
            "ASSETID", "UTXOID",  "NFTID", "SUBNETID", "CHAINID", "NODEID", "SECPSIG", "SECPENC", "JPEG", "PNG", 
            "BMP", "ICO", "SVG", "CSV", "JSON", "PROTOBUF", "YAML", "EMAIL", "URL", "IPFS", "ONION", "MAGNET"
        ];
    }
}

export abstract class PayloadBase {
    protected payload:Buffer;
    protected typeid:number = undefined;
    
    typeID():number {
        return this.typeid;
    }

    typeName():string {
        return PayloadTypes.getInstance().lookupType(this.typeid);
    }

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        let size:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt8(0);
        offset += 4;
        this.typeid = bintools.copyFrom(bytes, offset, offset + 1).readUInt8(0);
        offset += 1
        this.payload = bintools.copyFrom(bytes, offset, offset + size - 1);
        return offset + this.payload.length - 1;
    }

    toBuffer():Buffer {
        let sizebuff:Buffer = Buffer.alloc(4);
        sizebuff.writeUInt32BE(this.payload.length + 1, 0);
        let typebuff:Buffer = Buffer.alloc(1);
        typebuff.writeUInt8(this.typeid, 0);
        return Buffer.concat([sizebuff, typebuff, this.payload]);
    }

    abstract returnType():any;

    constructor(){}

}

export class BINPayload extends PayloadBase {
    static typeid = 0;

    returnType():Buffer {
        return this.payload;
    }

    constructor(payload:Buffer = undefined){
        super();
        if(payload) {
            this.payload = payload;
        }
    }
}

export class UTF8Payload extends PayloadBase {
    static typeid = 1;

    returnType():string {
        return this.payload.toString("utf8");
    }

    constructor(payload:string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else {
            this.payload = Buffer.from(payload, "utf8");
        }
    }
}

export class HEXSTRPayload extends PayloadBase {
    static typeid = 2;

    returnType():string {
        return this.payload.toString("hex");
    }

    constructor(payload:string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else {
            this.payload = Buffer.from(payload, "hex");
        }
    }
}

export class B58STRPayload extends PayloadBase {
    static typeid = 3;

    returnType():string {
        return bintools.bufferToB58(this.payload);
    }

    constructor(payload:string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else {
            this.payload = bintools.b58ToBuffer(payload);
        }
    }
}

export class B64STRPayload extends PayloadBase {
    static typeid = 4;

    returnType():string {
        return this.payload.toString("base64");
    }

    constructor(payload:string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else {
            this.payload = Buffer.from(payload, "base64");
        }
    }
}

export class BIGNUMPayload extends PayloadBase {
    static typeid = 5;

    returnType():BN {
        return bintools.fromBufferToBN(this.payload);
    }

    constructor(payload:string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else {
            this.payload = Buffer.from(payload, "base64");
        }
    }
}

class ChainAddressPayload extends PayloadBase {
    static typeid = 6;
    protected chainid:string = "";

    returnType():string {
        return bintools.addressToString(this.chainid, this.payload);
    }

    constructor(payload:string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else {
            this.payload = bintools.stringToAddress(payload);
        }
    }
}

export class XCHAINPayload extends ChainAddressPayload {
    static typeid = 6;
    static chainid = "X";
}

export class PCHAINPayload extends ChainAddressPayload {
    static typeid = 7;
    static chainid = "P";
}

export class CCHAINPayload extends ChainAddressPayload {
    static typeid = 8;
    static chainid = "C";
}

abstract class AVASerializedPayload extends PayloadBase {
    returnType():string {
        return bintools.avaSerialize(this.payload);
    }

    constructor(payload:string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else {
            this.payload = bintools.avaDeserialize(payload);
        }
    }
}

export class TXIDPayload extends AVASerializedPayload {
    static typeid = 9;
}

export class ASSETIDPayload extends AVASerializedPayload {
    static typeid = 10;
}

export class UTXOIDPayload extends AVASerializedPayload {
    static typeid = 11;
}

export class NFTIDPayload extends AVASerializedPayload {
    static typeid = 12;
}

export class SUBNETIDPayload extends AVASerializedPayload {
    static typeid = 13;
}

export class CHAINIDPayload extends AVASerializedPayload {
    static typeid = 14;
}

export class NODEIDPayload extends AVASerializedPayload {
    static typeid = 15;
}

export class SECPSIGPayload extends B58STRPayload {
    static typeid = 16;
}

export class SECPENCPayload extends B58STRPayload {
    static typeid = 17;
}

export class JPEGPayload extends BINPayload {
    static typeid = 18;
}

export class PNGPayload extends BINPayload {
    static typeid = 19;
}

export class BMPPayload extends BINPayload {
    static typeid = 20;
}

export class ICOPayload extends BINPayload {
    static typeid = 21;
}

export class SVGPayload extends UTF8Payload {
    static typeid = 22;
}

export class CSVPayload extends UTF8Payload {
    static typeid = 23;
}

export class JSONPayload extends PayloadBase {
    static typeid = 24;

    returnType():any {
        return JSON.parse(this.payload.toString("utf8"));
    }

    constructor(payload:any|string|Buffer = undefined){
        super();
        if(payload instanceof Buffer){
            this.payload = payload;
        } else if(typeof payload === "string") {
            this.payload = Buffer.from(payload, "utf8");
        } else {
            let jsonstr:string = JSON.stringify(payload);
            this.payload = Buffer.from(jsonstr, "utf8");
        }
    }
}

export class PROTOBUFPayload extends BINPayload {
    static typeid = 25;
}

export class YAMLPayload extends UTF8Payload {
    static typeid = 26;
}

export class EMAILPayload extends UTF8Payload {
    static typeid = 27;
}

export class URLPayload extends UTF8Payload {
    static typeid = 28;
}

export class IPFSPayload extends B58STRPayload {
    static typeid = 29;
}

export class ONIONPayload extends UTF8Payload {
    static typeid = 30;
}

export class MAGNETPayload extends UTF8Payload {
    static typeid = 31;
}