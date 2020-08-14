/**
 * @packageDocumentation
 * @module Utils-Types
 */
import { Buffer } from 'buffer/';
import { StoreAPI } from 'store2';
import { ClientRequest } from 'http';
import { AxiosRequestConfig } from 'axios';
import BinTools from './bintools';
import DB from './db';
import AvalancheCore from '../avalanche';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Response data for HTTP requests.
 */
export class RequestResponseData {
  data: any;

  headers:any;

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
    if (this.db && this.baseurl !== baseurl) {
      const backup = this.db.getAll();
      this.db.clearAll();
      this.baseurl = baseurl;
      this.db = DB.getNamespace(baseurl);
      this.db.setAll(backup, true);
    } else {
      this.baseurl = baseurl;
      this.db = DB.getNamespace(baseurl);
    }
  };

  /**
     * Returns the baseurl's path.
     */
  getBaseURL = () : string => this.baseurl;

  /**
     * Returns the baseurl's database.
     */
  getDB = ():StoreAPI => this.db;

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

  protected prepHeaders = (contentType?:string, acceptType?:string):object => {
    const headers:object = {};
    if (contentType !== undefined) {
      headers['Content-Type'] = contentType;
    } else {
      headers['Content-Type'] = this.contentType;
    }

    if (acceptType !== undefined) {
      headers["Accept"] = acceptType;
    } else if (this.acceptType !== undefined) {
      headers["Accept"] = this.acceptType;
    }
    return headers;
  }

  protected axConf = ():AxiosRequestConfig => {
    return  {
      baseURL: `${this.core.getProtocol()}://${this.core.getIP()}:${this.core.getPort()}`,
      responseType: 'json',
    };

  }

  get = async (baseurl?:string, contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;

    let headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.get(ep, {}, headers, this.axConf()).then((resp:RequestResponseData) => resp);
  };

  post = async (method:string, params?:Array<object> | object, baseurl?:string,
    contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.post(ep, {}, JSON.stringify(rpc), headers, this.axConf())
      .then((resp:RequestResponseData) => resp);
  };

  put = async (method:string,
    params?:Array<object> | object,
    baseurl?:string,
    contentType?:string,
    acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.put(ep, {}, JSON.stringify(rpc), headers, this.axConf())
      .then((resp:RequestResponseData) => resp);
  };

  delete = async (method:string, params?:Array<object> | object, baseurl?:string,
    contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.delete(ep, {}, headers, this.axConf()).then((resp:RequestResponseData) => resp);
  };

  patch = async (method:string, params?:Array<object> | object, baseurl?:string,
    contentType?:string, acceptType?:string):Promise<RequestResponseData> => {
    const ep:string = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    }

    const headers:object = this.prepHeaders(contentType, acceptType);

    return this.core.patch(ep, {}, JSON.stringify(rpc), headers, this.axConf())
      .then((resp:RequestResponseData) => resp);
  };

  /**
     * Returns the type of the entity attached to the incoming request
     */
  getContentType = ():string => this.contentType;

  /**
     * Returns what type of representation is desired at the client side
     */
  getAcceptType = ():string => this.acceptType;

  /**
     *
     * @param core Reference to the Avalanche instance using this endpoint
     * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
     * @param contentType Optional Determines the type of the entity attached to the
     * incoming request
     * @param acceptType Optional Determines the type of representation which is
     * desired on the client side
     */
  constructor(core:AvalancheCore,
    baseurl:string,
    contentType:string = 'application/json;charset=UTF-8',
    acceptType:string = undefined) {
    super(core, baseurl);
    this.contentType = contentType;
    this.acceptType = acceptType;
  }
}

export class JRPCAPI extends APIBase {
  protected jrpcVersion:string = '2.0';

  protected rpcid = 1;

  callMethod = async (method:string,
    params?:Array<object> | object,
    baseurl?:string):Promise<RequestResponseData> => {
    const ep = baseurl || this.baseurl;
    const rpc:any = {};
    rpc.id = this.rpcid;
    rpc.method = method;

    // Set parameters if exists
    if (params) {
      rpc.params = params;
    } else if (this.jrpcVersion === '1.0') {
      rpc.params = [];
    }

    if (this.jrpcVersion !== '1.0') {
      rpc.jsonrpc = this.jrpcVersion;
    }

    const headers:object = { 'Content-Type': 'application/json;charset=UTF-8' };

    const axConf:AxiosRequestConfig = {
      baseURL: `${this.core.getProtocol()}://${this.core.getIP()}:${this.core.getPort()}`,
      responseType: 'json',
    };

    return this.core.post(ep, {}, JSON.stringify(rpc), headers, axConf)
      .then((resp:RequestResponseData) => {
        if (resp.status >= 200 && resp.status < 300) {
          this.rpcid += 1;
          if (typeof resp.data === 'string') {
            resp.data = JSON.parse(resp.data);
          }
          if (typeof resp.data === 'object' && (resp.data === null || 'error' in resp.data)) {
            throw new Error(`Error returned: ${JSON.stringify(resp.data)}`);
          }
        }
        return resp;
      });
  };

  /**
     * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
     * request ID that will be sent.
     */
  getRPCID = ():number => this.rpcid;

  /**
     *
     * @param core Reference to the Avalanche instance using this endpoint
     * @param baseurl Path of the APIs baseurl - ex: "/ext/bc/avm"
     * @param jrpcVersion The jrpc version to use, default "2.0".
     */
  constructor(core:AvalancheCore, baseurl:string, jrpcVersion:string = '2.0') {
    super(core, baseurl);
    this.jrpcVersion = jrpcVersion;
    this.rpcid = 1;
  }
}

/**
 * Class for representing a threshold and set of minting addresses in Avalanche. 
 * 
 * @typeparam MinterSet including a threshold and array of addresses
 */
export class MinterSet {
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
            if(!Buffer.isBuffer(addresses[i])) {
                addrs.push(bintools.stringToBuffer(addresses[i] as string))
            } else {
                addrs.push(addresses[i] as Buffer)
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
        this.threshold = threshold;
        this.minters = this._cleanAddresses(minters);
    }
}

/**
 * Class for representing a private and public keypair in Avalanche. 
 * All APIs that need key pairs should extend on this class.
 */
export class KeyPair {
  protected pubk:Buffer;

  protected privk:Buffer;

  protected chainid:string = '';
  protected hrp:string = '';

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
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public
     * key of the signer
     */
  recover:(msg:Buffer, sig:Buffer) => Buffer;

  /**
     * Verifies that the private key associated with the provided public key produces the
     * signature associated with the given message.
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
  getPrivateKey = ():Buffer => this.privk;

  /**
     * Returns a reference to the public key.
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key
     */
  getPublicKey = ():Buffer => this.pubk;

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
  getChainID = ():string => this.chainid;

  /**
     * Sets the the chainID associated with this key.
     *
     * @param chainid String for the chainID
     */
  setChainID = (chainid:string):void => {
    this.chainid = chainid;
  };

  /**
   * Returns the Human-Readable-Part of the network associated with this key.
   *
   * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
   */
  getHRP = ():string => this.hrp;

  /**
   * Sets the the Human-Readable-Part of the network associated with this key.
   *
   * @param hrp String for the Human-Readable-Part of Bech32 addresses
   */
  setHRP = (hrp:string):void => {
    this.hrp = hrp;
  };

  constructor(hrp:string, chainid:string) {
    this.chainid = chainid;
    this.hrp = hrp;
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

  protected chainid:string = '';
  protected hrp:string = '';

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
     * @returns An array of {@link https://github.com/feross/buffer|Buffer}  representations
     * of the addresses
     */
  getAddresses = ():Array<Buffer> => Object.values(this.keys).map((kp) => kp.getAddress());

  /**
     * Gets an array of addresses stored in the [[KeyChain]].
     *
     * @returns An array of string representations of the addresses
     */
  getAddressStrings = ():Array<string> => Object.values(this.keys)
    .map((kp) => kp.getAddressString());

  /**
     * Adds the key pair to the list of the keys managed in the [[KeyChain]].
     *
     * @param newKey A key pair of the appropriate class to be added to the [[KeyChain]]
     */
  addKey = (newKey:KPClass) => {
    newKey.setChainID(this.chainid);
    this.keys[newKey.getAddress().toString('hex')] = newKey;
  };

  /**
     * Removes the key pair from the list of they keys managed in the [[KeyChain]].
     *
     * @param key A {@link https://github.com/feross/buffer|Buffer} for the address or
     * KPClass to remove
     *
     * @returns The boolean true if a key was removed.
     */
  removeKey = (key:KPClass | Buffer) => {
    let kaddr:string;
    if (key instanceof Buffer) {
      kaddr = key.toString('hex');
    } else {
      kaddr = key.getAddress().toString('hex');
    }
    if (kaddr in this.keys) {
      delete this.keys[kaddr];
      return true;
    }
    return false;
  };

  /**
     * Checks if there is a key associated with the provided address.
     *
     * @param address The address to check for existence in the keys database
     *
     * @returns True on success, false if not found
     */
  hasKey = (address:Buffer):boolean => (address.toString('hex') in this.keys);

  /**
     * Returns the [[KeyPair]] listed under the provided address
     *
     * @param address The {@link https://github.com/feross/buffer|Buffer} of the address to
     * retrieve from the keys database
     *
     * @returns A reference to the [[KeyPair]] in the keys database
     */
  getKey = (address:Buffer): KPClass => this.keys[address.toString('hex')];

  /**
     * Returns the chainID associated with this [[KeyChain]].
     *
     * @returns The [[KeyChain]]'s chainID
     */
  getChainID = ():string => this.chainid;

  /**
     * Sets the the chainID associated with this [[KeyChain]] and all associated keypairs.
     *
     * @param chainid String for the chainID
     */
  setChainID = (chainid:string):void => {
    this.chainid = chainid;
    for (const address in this.keys) {
      this.keys[address].setChainID(chainid);
    }
  };

  /**
   * Returns the Human-Readable-Part of the network associated with this key.
   *
   * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
   */
  getHRP = ():string => this.hrp;

  /**
   * Sets the the Human-Readable-Part of the network associated with this key.
   *
   * @param hrp String for the Human-Readable-Part of Bech32 addresses
   */
  setHRP = (hrp:string):void => {
    this.hrp = hrp;
  };

  /**
     * Returns instance of [[KeyChain]].
     *
     * @param hrp String for the Human-Readable-Part of Bech32 addresses 
     * @param chainid The hostname to resolve to reach the Avalanche Client APIs
     * 
     */
  constructor(hrp:string, chainid:string) {
    this.chainid = chainid;
    this.hrp = hrp;
  }
}

/**
 * Abstract class that implements basic functionality for managing a
 * {@link https://github.com/feross/buffer|Buffer} of an exact length.
 *
 * Create a class that extends this one and override bsize to make it validate for exactly
 * the correct length.
 */
export abstract class NBytes {
  protected bytes:Buffer;

  protected bsize:number;

  /**
     * Returns the length of the {@link https://github.com/feross/buffer|Buffer}.
     *
     * @returns The exact length requirement of this class
     */
  getSize = () => this.bsize;

  /**
     * Takes a base-58 encoded string, verifies its length, and stores it.
     *
     * @returns The size of the {@link https://github.com/feross/buffer|Buffer}
     */
  fromString(b58str:string):number {
    try {
      this.fromBuffer(bintools.b58ToBuffer(b58str));
    } catch (e) {
      /* istanbul ignore next */
      const emsg:string = `Error - NBytes.fromString: ${e}`;
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
      if (buff.length - offset < this.bsize) {
        /* istanbul ignore next */
        throw new Error(`Buffer length must be at least ${this.bsize} bytes.`);
      }

      this.bytes = bintools.copyFrom(buff, offset, offset + this.bsize);
    } catch (e) {
      /* istanbul ignore next */
      const emsg:string = `Error - NBytes.fromBuffer: ${e}`;
      /* istanbul ignore next */
      throw new Error(emsg);
    }
    return offset + this.bsize;
  }

  /**
     * @returns A reference to the stored {@link https://github.com/feross/buffer|Buffer}
     */
  toBuffer():Buffer {
    return this.bytes;
  }

  /**
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

export const NetworkIDToHRP:object = {
  1: "avax",
  2: "cascade",
  3: "denali",
  4: "everest",
  12345: "local"
};

export const HRPToNetworkID:object = {
  "avax": 1,
  "cascade": 2,
  "denali": 3,
  "everest": 4,
  "local": 12345
};

export const FallbackHRP:string = "custom";

export const DefaultNetworkID:number = 3;

export function getPreferredHRP(networkID:number = undefined) {
  if (networkID in NetworkIDToHRP) {
    return NetworkIDToHRP[networkID];
  } else if(typeof networkID === "undefined") {
    return DefaultNetworkID;
  }
  return FallbackHRP;
}

// TODO: UPDATE FOR MAINNET

const platformChainID:string = "11111111111111111111111111111111LpoYY";
const XChainAlias:string = "X";
const CChainAlias:string = "C";
const PChainAlias:string = "P";
const XChainVMName:string = "avm";
const CChainVMName:string = "evm";
const PChainVMName:string = "platformvm";

const n1X:object = {
  blockchainID: '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n1P:object = {
  blockchainID: platformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0
};

const n1C:object = {
  blockchainID: '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

// END TODO

const n2X:object = {
  blockchainID: '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n2P:object = {
  blockchainID: platformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0
};

const n2C:object = {
  blockchainID: '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

const n3X:object = {
  blockchainID: 'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n3P:object = {
  blockchainID: '',
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0
};

const n3C:object = {
  blockchainID: 'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

// TODO: UPDATE FOR EVEREST
const n4X:object = {
  blockchainID: 'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n4P:object = {
  blockchainID: platformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0
};

const n4C:object = {
  blockchainID: 'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

// END TODO

const n12345X:any = { ...n2X };
n12345X.blockchainID = '4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH';
const n12345P:any = { ...n2P };
n12345P.blockchainID = platformChainID;
const n12345C:any = { ...n2C };
n12345C.blockchainID = 'jvYyfQTxGMJLuGWa55kdP2p2zSUYsQ5Raupu4TW34ZAUBAbtq';

export class Defaults {
  static network = {
    1: { // update before mainnet
      hrp: NetworkIDToHRP[1],
      X: n1X,
      '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM': n1X,
      P: n1P,
      '11111111111111111111111111111111LpoYY': n1P,
      C: n1C,
      '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i': n1C,
    }, 
    2: {
      hrp: NetworkIDToHRP[2],
      X: n2X,
      '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM': n2X,
      P: n2P,
      '11111111111111111111111111111111LpoYY': n2P,
      C: n2C,
      '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i': n2C,
    },
    3: {
      hrp: NetworkIDToHRP[3],
      X: n3X,
      'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L': n3X,
      P: n3P,
      '11111111111111111111111111111111LpoYY': n3P,
      C: n3C,
      'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9': n3C,
    },
    4: { // update before everest
      hrp: NetworkIDToHRP[4],
      X: n4X,
      'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L': n4X,
      P: n4P,
      '11111111111111111111111111111111LpoYY': n4P,
      C: n4C,
      'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9': n4C,
    },
    12345: {
      hrp: NetworkIDToHRP[12345],
      X: n12345X,
      '4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH': n12345X,
      P: n12345P,
      '11111111111111111111111111111111LpoYY': n12345P,
      C: n12345C,
      'jvYyfQTxGMJLuGWa55kdP2p2zSUYsQ5Raupu4TW34ZAUBAbtq': n12345C,
    },
  };
}
