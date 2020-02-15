/**
 * @module Utils
 */
import SlopesCore from '../slopes';
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
    protected core:SlopesCore;
    protected baseurl:string;
    protected db:StoreAPI;

    /**
     * Sets the path of the APIs baseurl.
     * 
     * @param baseurl Path of the APIs baseurl - ex: "/ext/ava"
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
     * @param core Reference to the Slopes instance using this baseurl
     * @param baseurl Path to the baseurl - ex: "/ext/subnet/avm"
     */
    constructor(core:SlopesCore, baseurl:string) {
        this.core = core;
        this.setBaseURL(baseurl);
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
     * @param core Reference to the Slopes instance using this endpoint
     * @param baseurl Path of the APIs baseurl - ex: "/ext/subnet/avm"
     * @param jrpcVersion The jrpc version to use, default "2.0".
     */
    constructor(core:SlopesCore, baseurl:string, jrpcVersion:string = "2.0") {
        super(core, baseurl);
        this.jrpcVersion = jrpcVersion;
        this.rpcid = 1;
    }
}

/**
 * Class for representing a private and public keypair in Slopes. 
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
 * Class for representing a key chain in Slopes. 
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
    fromBuffer(buff:Buffer):number {
        try {
            if(buff.length != this.bsize){
                /* istanbul ignore next */
                throw new Error("Buffer length must be exactly " + this.bsize + " bytes.");
            }
            this.bytes = Buffer.from(buff);
        } catch(e) {
            /* istanbul ignore next */
            let emsg:string = "Error - NBytes.fromBuffer: " + e;
            /* istanbul ignore next */
            throw new Error(emsg);
        }
        return this.bsize;
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
    blockchainID: "HD8HEwNKTXRBcVUqvQW2LRu9izqej91xzGmXATF4KMMV6LLm7",
    alias: "X",
    vm: "avm"
};

let n2_platform:object =  {
    blockchainID: "",
    alias: "P",
    vm: "platform"
};

let n2_contracts:object = {
    blockchainID: "",
    alias: "C",
    vm: "contracts"
}

export class Defaults {
    static network = {
        1: {}, //update before mainnet
        2: {
            "avm": n2_avm,
            "X": n2_avm,
            "HD8HEwNKTXRBcVUqvQW2LRu9izqej91xzGmXATF4KMMV6LLm7": n2_avm,
            "platform": n2_platform,
            "P": n2_platform,
            "BCID1": n2_platform,
            "contracts": n2_contracts,
            "C": n2_contracts,
            "BCID2": n2_contracts
        },
        49: {
            "avm": n2_avm,
            "X": n2_avm,
            "HD8HEwNKTXRBcVUqvQW2LRu9izqej91xzGmXATF4KMMV6LLm7": n2_avm,
            "platform": n2_platform,
            "P": n2_platform,
            "BCID1": n2_platform,
            "contracts": n2_contracts,
            "C": n2_contracts,
            "BCID2": n2_contracts
        },
        12345: {
            "avm": n2_avm,
            "X": n2_avm,
            "GJABrZ9A6UQFpwjPU8MDxDd8vuyRoDVeDAXc694wJ5t3zEkhU": n2_avm,
            "platform": n2_platform,
            "P": n2_platform,
            "BCID1": n2_platform,
            "contracts": n2_contracts,
            "C": n2_contracts,
            "BCID2": n2_contracts
        }
    };
}