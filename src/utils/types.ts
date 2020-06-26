/**
 * @packageDocumentation
 * @module Utils-Types
 */
import AvalancheCore from '../avalanche';
import { Buffer } from "buffer/";
import DB from "./db";
import { StoreAPI } from 'store2';
import BinTools  from './bintools';
import { ClientRequest } from "http";
import { AxiosRequestConfig } from 'axios';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Response data for HTTP requests.
 */
export class RequestResponseData {
    data: string | object | Array<object>;
    headers:object;
    status: number;
    statusText: string;
    request:ClientRequest | XMLHttpRequest;
}

/**
 * Abstract class defining a generic endpoint that all endpoints must implement (extend).
 */
export abstract class APIBase {
    protected core:AvalancheCore;
    protected baseurl:string;
    protected db:StoreAPI;

    /**
     * Sets the path of the APIs baseurl.
     * 
     * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
     */
    setBaseURL = (baseurl:string) => {
        if(this.db && this.baseurl !== baseurl){
            let backup = this.db.getAll();
            this.db.clearAll();
            this.baseurl = baseurl;
            this.db = DB.getNamespace(baseurl);
            this.db.setAll(backup, true);
        } else {
            this.baseurl = baseurl;
            this.db = DB.getNamespace(baseurl);
        }
    } 

    /**
     * Returns the baseurl's path. 
     */
    getBaseURL = () : string => {
        return this.baseurl;
    }

    /**
     * Returns the baseurl's database.
     */
    getDB = ():StoreAPI => {
        return this.db;
    }

    /**
     * 
     * @param core Reference to the Avalanche instance using this baseurl
     * @param baseurl Path to the baseurl - ex: "/ext/bc/avm"
     */
    constructor(core:AvalancheCore, baseurl:string) {
        this.core = core;
        this.setBaseURL(baseurl);
    }
}

export class RESTAPI extends APIBase {
    protected contentType:string;
    protected acceptType:string;

    get = async (baseurl?:string, contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
        let ep:string = baseurl ? baseurl : this.baseurl;

        let headers:object = {};
        if(contentType !== undefined) {
            headers["Content-Type"] = contentType;
        } else {
            headers["Content-Type"] = this.contentType;
        }

        let acceptTypeStr:string = this.acceptType;
        if(acceptType !== undefined) {
            headers["Accept"] = acceptType;
        } else if(acceptTypeStr !== undefined) {
            headers["Accept"] = acceptTypeStr;
        }

        let axConf:AxiosRequestConfig = {
            baseURL:this.core.getProtocol()+"://"+this.core.getIP()+":"+this.core.getPort(),
            responseType: 'json'
        };

        return this.core.get(ep, {}, headers, axConf).then((resp:RequestResponseData) => {
            return resp;
        });
    }

    post = async (method:string, params?:Array<object> | object, baseurl?:string, contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
        let ep:string = baseurl ? baseurl : this.baseurl;
        let rpc:object = {};
        rpc["method"] = method;

        // Set parameters if exists
        if(params) {
            rpc['params'] = params;
        }

        let headers:object = {};
        if(contentType !== undefined) {
            headers["Content-Type"] = contentType;
        } else {
            headers["Content-Type"] = this.contentType;
        }

        let acceptTypeStr:string = this.acceptType;
        if(acceptType !== undefined) {
            headers["Accept"] = acceptType;
        } else if(acceptTypeStr !== undefined) {
            headers["Accept"] = acceptTypeStr;
        }

        let axConf:AxiosRequestConfig = {
            baseURL:this.core.getProtocol()+"://"+this.core.getIP()+":"+this.core.getPort(),
            responseType: 'json'
        };

        return this.core.post(ep, {}, JSON.stringify(rpc), headers, axConf).then((resp:RequestResponseData) => {
            return resp;
        });
    }

    put = async (method:string, params?:Array<object> | object, baseurl?:string, contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
        let ep:string = baseurl ? baseurl : this.baseurl;
        let rpc:object = {};
        rpc["method"] = method;

        // Set parameters if exists
        if(params) {
            rpc['params'] = params;
        }

        let headers:object = {};
        if(contentType !== undefined) {
            headers["Content-Type"] = contentType;
        } else {
            headers["Content-Type"] = this.contentType;
        }

        let acceptTypeStr:string = this.acceptType;
        if(acceptType !== undefined) {
            headers["Accept"] = acceptType;
        } else if(acceptTypeStr !== undefined) {
            headers["Accept"] = acceptTypeStr;
        }

        let axConf:AxiosRequestConfig = {
            baseURL:this.core.getProtocol()+"://"+this.core.getIP()+":"+this.core.getPort(),
            responseType: 'json'
        };

        return this.core.put(ep, {}, JSON.stringify(rpc), headers, axConf).then((resp:RequestResponseData) => {
            return resp;
        });
    }

    delete = async (method:string, params?:Array<object> | object, baseurl?:string, contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
        let ep:string = baseurl ? baseurl : this.baseurl;
        let rpc:object = {};
        rpc["method"] = method;

        // Set parameters if exists
        if(params) {
            rpc['params'] = params;
        }

        let headers:object = {};
        if(contentType !== undefined) {
            headers["Content-Type"] = contentType;
        } else {
            headers["Content-Type"] = this.contentType;
        }

        let acceptTypeStr:string = this.acceptType;
        if(acceptType !== undefined) {
            headers["Accept"] = acceptType;
        } else if(acceptTypeStr !== undefined) {
            headers["Accept"] = acceptTypeStr;
        }

        let axConf:AxiosRequestConfig = {
            baseURL:this.core.getProtocol()+"://"+this.core.getIP()+":"+this.core.getPort(),
            responseType: 'json'
        };

        return this.core.delete(ep, {}, headers, axConf).then((resp:RequestResponseData) => {
            return resp;
        });
    }

    patch = async (method:string, params?:Array<object> | object, baseurl?:string, contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
        let ep:string = baseurl ? baseurl : this.baseurl;
        let rpc:object = {};
        rpc["method"] = method;

        // Set parameters if exists
        if(params) {
            rpc['params'] = params;
        }

        let headers:object = {};
        if(contentType !== undefined) {
            headers["Content-Type"] = contentType;
        } else {
            headers["Content-Type"] = this.contentType;
        }

        let acceptTypeStr:string = this.acceptType;
        if(acceptType !== undefined) {
            headers["Accept"] = acceptType;
        } else if(acceptTypeStr !== undefined) {
            headers["Accept"] = acceptTypeStr;
        }

        let axConf:AxiosRequestConfig = {
            baseURL:this.core.getProtocol()+"://"+this.core.getIP()+":"+this.core.getPort(),
            responseType: 'json'
        };

        return this.core.patch(ep, {}, JSON.stringify(rpc), headers, axConf).then((resp:RequestResponseData) => {
            return resp;
        });
    }

    /**
     * Returns the type of the entity attached to the incoming request
     */
    getContentType = ():string => {
        return this.contentType;
    }

    /**
     * Returns what type of representation is desired at the client side
     */
    getAcceptType = ():string => {
        return this.acceptType;
    }

    /**
     * 
     * @param core Reference to the Avalanche instance using this endpoint
     * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
     * @param contentType Optional Determines the type of the entity attached to the incoming request
     * @param acceptType Optional Determines the type of representation which is desired on the client side
     */
    constructor(core:AvalancheCore, baseurl:string, contentType:string = "application/json;charset=UTF-8", acceptType:string = undefined) {
        super(core, baseurl);
        this.contentType = contentType;
        this.acceptType = acceptType;
    }
}

export class JRPCAPI extends APIBase {
    protected jrpcVersion:string = "2.0";
    protected rpcid = 1;
    callMethod = async (method:string, params?:Array<object> | object, baseurl?:string):Promise<RequestResponseData> => {
        let ep = baseurl ? baseurl : this.baseurl;
        let rpc:object = {};
        rpc["id"] = this.rpcid;
        rpc["method"] = method;

        // Set parameters if exists
        if(params){
            rpc['params'] = params;
        } else if(this.jrpcVersion == "1.0"){
            rpc["params"] = [];
        }

        if(this.jrpcVersion != "1.0") {
            rpc["jsonrpc"] = this.jrpcVersion;
        }

        let headers:object = {"Content-Type": "application/json;charset=UTF-8"};

        let axConf:AxiosRequestConfig = {
            baseURL:this.core.getProtocol()+"://"+this.core.getIP()+":"+this.core.getPort(),
            responseType: 'json'
        };

        return this.core.post(ep, {}, JSON.stringify(rpc), headers, axConf).then( (resp:RequestResponseData) => {
            if(resp.status >= 200 && resp.status < 300){
                this.rpcid += 1;
                if(typeof resp.data === "string"){
                    resp.data = JSON.parse(resp.data);
                    
                }
                if(typeof resp.data === 'object' && 'error' in resp.data) {
                    throw new Error("Error returned: " + JSON.stringify(resp.data));
                }
                return resp;
            }
        });
    }   

    /**
     * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next request ID that will be sent.
     */
    getRPCID = ():number => {
        return this.rpcid;
    }

    /**
     * 
     * @param core Reference to the Avalanche instance using this endpoint
     * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
     * @param jrpcVersion The jrpc version to use, default "2.0".
     */
    constructor(core:AvalancheCore, baseurl:string, jrpcVersion:string = "2.0") {
        super(core, baseurl);
        this.jrpcVersion = jrpcVersion;
        this.rpcid = 1;
    }
}

/**
 * Class for representing a private and public keypair in Avalanche. 
 * All APIs that need key pairs should extend on this class.
 */
export class KeyPair {
    protected pubk:Buffer;
    protected privk:Buffer;
    protected chainid:string = "";

    /**
     * Generates a new keypair.
     * 
     * @param entropy Optional parameter that may be necessary to produce secure keys
     */
    generateKey:(entropy?:Buffer) => void;
    /**
     * Imports a private key and generates the appropriate public key.
     * 
     * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key 
     * 
     * @returns true on success, false on failure
     */
    importKey:(privk:Buffer) => boolean;

    /**
     * Takes a message, signs it, and returns the signature.
     * 
     * @param msg The message to sign
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the signature
     */
    sign:(msg:Buffer) => Buffer;

    /**
     * Recovers the public key of a message signer from a message and its associated signature.
     * 
     * @param msg The message that's signed
     * @param sig The signature that's signed on the message
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key of the signer
     */
    recover:(msg:Buffer, sig:Buffer) => Buffer;

    /**
     * Verifies that the private key associated with the provided public key produces the signature associated with the given message.
     * 
     * @param msg The message associated with the signature
     * @param sig The signature of the signed message
     * @param pubk The public key associated with the message signature
     * 
     * @returns True on success, false on failure
     */
    verify:(msg:Buffer, sig:Buffer, pubk:Buffer) => boolean;

    /**
     * Returns a reference to the private key.
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the private key
     */
    getPrivateKey = ():Buffer => {
        return this.privk;
    }

    /**
     * Returns a reference to the public key.
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key
     */
    getPublicKey = ():Buffer => {
        return this.pubk;
    }

    /**
     * Returns a string representation of the private key.
     * 
     * @returns A string representation of the public key
     */
    getPrivateKeyString:() => string;

    /**
     * Returns the public key.
     * 
     * @returns A string representation of the public key
     */
    getPublicKeyString:() => string;

    /**
     * Returns the address.
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer}  representation of the address
     */
    getAddress:() => Buffer;

    /**
     * Returns the address's string representation.
     * 
     * @returns A string representation of the address
     */
    getAddressString:() => string;

    /**
     * Returns the chainID associated with this key.
     * 
     * @returns The [[KeyPair]]'s chainID
     */
    getChainID = ():string => {
        return this.chainid
    }

    /**
     * Sets the the chainID associated with this key.
     * 
     * @param chainid String for the chainID
     */
    setChainID = (chainid:string):void => {
        this.chainid = chainid;
    }

    constructor(chainid:string) {
        this.chainid = chainid
    }
}

/**
 * Class for representing a key chain in Avalanche. 
 * All endpoints that need key chains should extend on this class.
 * 
 * @typeparam KPClass extending [[KeyPair]] which is used as the key in [[KeyChain]]
 */
export class KeyChain<KPClass extends KeyPair> {
    protected keys:{[address: string]: KPClass} = {};
    protected chainid:string = "";

    /**
     * Makes a new [[KeyPair]], returns the address.
     * 
     * @param entropy Optional parameter that may be necessary to produce secure keys
     * 
     * @returns Address of the new [[KeyPair]]
     */
    makeKey:(entropy?:Buffer) => Buffer;

    /**
     * Given a private key, makes a new [[KeyPair]], returns the address.
     * 
     * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key 
     * 
     * @returns Address of the new [[KeyPair]]
     */
    importKey:(privk:Buffer) => Buffer;

    /**
     * Gets an array of addresses stored in the [[KeyChain]].
     * 
     * @returns An array of {@link https://github.com/feross/buffer|Buffer}  representations of the addresses
     */
    getAddresses = ():Array<Buffer> => {
        return Object.values(this.keys).map(kp => kp.getAddress());
    }

    /**
     * Gets an array of addresses stored in the [[KeyChain]].
     * 
     * @returns An array of string representations of the addresses
     */
    getAddressStrings = ():Array<string> => {
        return Object.values(this.keys).map(kp => kp.getAddressString());
    }

    /**
     * Adds the key pair to the list of the keys managed in the [[KeyChain]].
     * 
     * @param newKey A key pair of the appropriate class to be added to the [[KeyChain]]
     */
    addKey = (newKey:KPClass) => {
        newKey.setChainID(this.chainid);
        this.keys[newKey.getAddress().toString("hex")] = newKey;
    }

    /**
     * Removes the key pair from the list of they keys managed in the [[KeyChain]].
     * 
     * @param key A {@link https://github.com/feross/buffer|Buffer} for the address or KPClass to remove
     * 
     * @returns The boolean true if a key was removed.
     */
    removeKey = (key:KPClass | Buffer) => {
        let kaddr:string;
        if(key instanceof Buffer){
            kaddr = key.toString("hex");
        } else {
            kaddr = key.getAddress().toString("hex");
        }
        if(kaddr in this.keys){
            delete this.keys[kaddr];
            return true;
        } else {
            return false;
        }
    }

    /**
     * Checks if there is a key associated with the provided address.
     * 
     * @param address The address to check for existence in the keys database
     * 
     * @returns True on success, false if not found
     */
    hasKey = (address:Buffer):boolean => {
        return (address.toString("hex") in this.keys);
    }

    /**
     * Returns the [[KeyPair]] listed under the provided address
     * 
     * @param address The {@link https://github.com/feross/buffer|Buffer} of the address to retrieve from the keys database
     * 
     * @returns A reference to the [[KeyPair]] in the keys database
     */
    getKey = (address:Buffer): KPClass => {
        return this.keys[address.toString("hex")];
    }

    /**
     * Returns the chainID associated with this [[KeyChain]].
     * 
     * @returns The [[KeyChain]]'s chainID
     */
    getChainID = ():string => {
        return this.chainid
    }

    /**
     * Sets the the chainID associated with this [[KeyChain]] and all associated keypairs.
     * 
     * @param chainid String for the chainID
     */
    setChainID = (chainid:string):void => {
        this.chainid = chainid;
        for(let address in this.keys){
            this.keys[address].setChainID(chainid);
        }
    }

    /**
     * Returns instance of [[KeyChain]].
     */
    constructor(chainid:string) {
        this.chainid = chainid;
    }
}

/**
 * Abstract class that implements basic functionality for managing a {@link https://github.com/feross/buffer|Buffer} of an exact length.
 * 
 * Create a class that extends this one and override bsize to make it validate for exactly the correct length.
 */
export abstract class NBytes {
    protected bytes:Buffer;
    protected bsize:number;

    /**
     * Returns the length of the {@link https://github.com/feross/buffer|Buffer}.
     * 
     * @returns The exact length requirement of this class
     */
    getSize = () => {
        return this.bsize;
    }

    /**
     * Takes a base-58 encoded string, verifies its length, and stores it.
     * 
     * @returns The size of the {@link https://github.com/feross/buffer|Buffer}
     */
    fromString(b58str:string):number {
        try {
            this.fromBuffer(bintools.b58ToBuffer(b58str));
        } catch(e){
            /* istanbul ignore next */
            let emsg:string = "Error - NBytes.fromString: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
        return this.bsize;
    }

    /**
     * Takes a [[Buffer]], verifies its length, and stores it. 
     * 
     * @returns The size of the {@link https://github.com/feross/buffer|Buffer}
     */
    fromBuffer(buff:Buffer, offset:number = 0):number {
        try {
            if(buff.length - offset < this.bsize){
                /* istanbul ignore next */
                throw new Error("Buffer length must be at least " + this.bsize + " bytes.");
            }
            
            this.bytes = bintools.copyFrom(buff, offset, offset + this.bsize);
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - NBytes.fromBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
        return offset + this.bsize;
    }

    /**
     * Returns the stored {@link https://github.com/feross/buffer|Buffer}.
     * 
     * @returns A reference to the stored {@link https://github.com/feross/buffer|Buffer}
     */
    toBuffer():Buffer {
        return this.bytes;
    }

    /**
     * Returns a base-58 string of the stored {@link https://github.com/feross/buffer|Buffer}.
     * 
     * @returns A base-58 string of the stored {@link https://github.com/feross/buffer|Buffer}
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
    }
    /**
     * Returns instance of [[NBytes]].
     */
    constructor() {}
}

let n2_avm:object = {
    "blockchainID": "4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM",
    "alias": "X",
    "vm": "avm"
};

let n2_platform:object =  {
    "blockchainID": "11111111111111111111111111111111LpoYY",
    "alias": "P",
    "vm": "platform"
};

let n2_contracts:object = {
    "blockchainID": "2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i",
    "alias": "C",
    "vm": "contracts"
}

let n3_avm:object = {
    "blockchainID": "rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L",
    "alias": "X",
    "vm": "avm"
};

let n3_platform:object =  {
    "blockchainID": "11111111111111111111111111111111LpoYY",
    "alias": "P",
    "vm": "platform"
}

let n3_contracts:object = {
    "blockchainID": "zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9",
    "alias": "C",
    "vm": "contracts"
};

let n12345_avm:object = Object.assign({}, n2_avm);
n12345_avm["blockchainID"] = "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH";
let n12345_platform = Object.assign({}, n2_platform);
n12345_platform["blockchainID"] = "11111111111111111111111111111111LpoYY";
let n12345_contracts = Object.assign({}, n2_contracts);
n12345_contracts["blockchainID"] = "tZGm6RCkeGpVETUTp11DW3UYFZmm69zfqxchpHrSF7wgy8rmw";

export class Defaults {
    static network = {
        "1": {}, //update before mainnet
        "2": {
            "avm": n2_avm,
            "X": n2_avm,
            "4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM": n2_avm,
            "platform": n2_platform,
            "P": n2_platform,
            "11111111111111111111111111111111LpoYY": n2_platform,
            "contracts": n2_contracts,
            "C": n2_contracts,
            "2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i": n2_contracts
        },
        "3": {
            "avm": n3_avm,
            "X": n3_avm,
            "rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L": n3_avm,
            "platform": n3_platform,
            "P": n3_platform,
            "11111111111111111111111111111111LpoYY": n3_platform,
            "contracts": n3_contracts,
            "C": n3_contracts,
            "zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9": n3_contracts
        },
        "12345": {
            "avm": n12345_avm,
            "X": n12345_avm,
            "4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH": n12345_avm,
            "platform": n12345_platform,
            "P": n12345_platform,
            "11111111111111111111111111111111LpoYY": n12345_platform,
            "contracts": n12345_contracts,
            "C": n12345_contracts,
            "tZGm6RCkeGpVETUTp11DW3UYFZmm69zfqxchpHrSF7wgy8rmw": n12345_contracts
        }
    };
}
