/**
 * @packageDocumentation
 * @module Utils-BinTools
 */
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import createHash from 'create-hash';
import * as bech32 from 'bech32';
import { Base58 } from './base58';
import { Defaults } from './constants';

/**
 * A class containing tools useful in interacting with binary data cross-platform using
 * nodejs & javascript.
 *
 * This class should never be instantiated directly. Instead,
 * invoke the "BinTools.getInstance()" static * function to grab the singleton
 * instance of the tools.
 *
 * Everything in this library uses
 * the {@link https://github.com/feross/buffer|feross's Buffer class}.
 *
 * ```js
 * const bintools = BinTools.getInstance();
 * let b58str = bintools.bufferToB58(Buffer.from("Wubalubadubdub!"));
 * ```
 */
export default class BinTools {
  private static instance:BinTools;

  private constructor() {
    this.b58 = Base58.getInstance();
  }

  private b58:Base58;

  /**
   * Retrieves the BinTools singleton.
   */
  static getInstance(): BinTools {
    if (!BinTools.instance) {
      BinTools.instance = new BinTools();
    }
    return BinTools.instance;
  }

  /**
   * Returns true if base64, otherwise false
   * @param str the string to verify is Base64
   */
  isBase64(str:string) {
    if (str ==='' || str.trim() ===''){ return false; }
    try {
        let b64:Buffer = Buffer.from(str, "base64");
        return b64.toString("base64") === str;
    } catch (err) {
        return false;
    }
  }

  /**
   * Returns true if base58, otherwise false
   * @param str the string to verify is base58
   */
  isBase58(str:string) {
    if (str ==='' || str.trim() ===''){ return false; }
    try {
        return this.b58.encode(this.b58.decode(str)) === str;
    } catch (err) {
        return false;
    }
  }

  /**
   * Returns true if hexidecimal, otherwise false
   * @param str the string to verify is hexidecimal
   */
  isHex(str:string) {
    if (str ==='' || str.trim() ===''){ return false; }
    return (str.startsWith("0x") && str.slice(2).match(/^[0-9A-Fa-f]/g) || str.match(/^[0-9A-Fa-f]/g));
  }

  /**
   * Returns true if decimal, otherwise false
   * @param str the string to verify is hexidecimal
   */
  isDecimal(str:string) {
    if (str ==='' || str.trim() ===''){ return false; }
    try {
      return new BN(str, 10).toString(10) === str.trim();
    } catch (err) {
        return false;
    }
  }

  /**
   * Returns true if meets requirements to parse as an address as Bech32 on X-Chain or P-Chain, otherwise false
   * @param address the string to verify is address
   */
  isPrimaryBechAddress = (address:string):boolean => {
    const parts:Array<string> = address.trim().split('-');
    if(parts.length !== 2) {
      return false;
    }
    try {
      bech32.fromWords(bech32.decode(parts[1]).words);
    } catch(err) {
      return false
    }
    return true;
  };


  /**
     * Produces a string from a {@link https://github.com/feross/buffer|Buffer}
     * representing a string. ONLY USED IN TRANSACTION FORMATTING, ASSUMED LENGTH IS PREPENDED.
     *
     * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to a string
     */
  bufferToString = (buff:Buffer):string => this.copyFrom(buff, 2).toString('utf8');

  /**
     * Produces a {@link https://github.com/feross/buffer|Buffer} from a string. ONLY USED IN TRANSACTION FORMATTING, LENGTH IS PREPENDED.
     *
     * @param str The string to convert to a {@link https://github.com/feross/buffer|Buffer}
     */
  stringToBuffer = (str:string):Buffer => {
    const buff:Buffer = Buffer.alloc(2 + str.length);
    buff.writeUInt16BE(str.length, 0);
    buff.write(str, 2, str.length, 'utf8');
    return buff;
  };

  /**
     * Makes a copy (no reference) of a {@link https://github.com/feross/buffer|Buffer}
     * over provided indecies.
     *
     * @param buff The {@link https://github.com/feross/buffer|Buffer} to copy
     * @param start The index to start the copy
     * @param end The index to end the copy
     */
  copyFrom = (buff:Buffer, start:number = 0, end:number = undefined):Buffer => {
    if (end === undefined) {
      end = buff.length;
    }
    return Buffer.from(Uint8Array.prototype.slice.call(buff.slice(start, end)));
  };

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string of
     * the {@link https://github.com/feross/buffer|Buffer}.
     *
     * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to base-58
     */
  bufferToB58 = (buff:Buffer):string => this.b58.encode(buff);

  /**
     * Takes a base-58 string and returns a {@link https://github.com/feross/buffer|Buffer}.
     *
     * @param b58str The base-58 string to convert
     * to a {@link https://github.com/feross/buffer|Buffer}
     */
  b58ToBuffer = (b58str:string):Buffer => this.b58.decode(b58str);

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} and returns an ArrayBuffer.
     *
     * @param buff The {@link https://github.com/feross/buffer|Buffer} to
     * convert to an ArrayBuffer
     */
  fromBufferToArrayBuffer = (buff:Buffer):ArrayBuffer => {
    const ab = new ArrayBuffer(buff.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buff.length; ++i) {
      view[i] = buff[i];
    }
    return view;
  };

  /**
     * Takes an ArrayBuffer and converts it to a {@link https://github.com/feross/buffer|Buffer}.
     *
     * @param ab The ArrayBuffer to convert to a {@link https://github.com/feross/buffer|Buffer}
     */
  fromArrayBufferToBuffer = (ab:ArrayBuffer):Buffer => {
    const buf = Buffer.alloc(ab.byteLength);
    for (let i = 0; i < ab.byteLength; ++i) {
      buf[i] = ab[i];
    }
    return buf;
  };

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} and converts it
     * to a {@link https://github.com/indutny/bn.js/|BN}.
     *
     * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert
     * to a {@link https://github.com/indutny/bn.js/|BN}
     */
  fromBufferToBN = (buff:Buffer):BN => {
    if(typeof buff === "undefined") {
      return undefined;
    }
    return new BN(buff.toString('hex'), 16, 'be')
  };
    /**
     * Takes a {@link https://github.com/indutny/bn.js/|BN} and converts it
     * to a {@link https://github.com/feross/buffer|Buffer}.
     *
     * @param bn The {@link https://github.com/indutny/bn.js/|BN} to convert
     * to a {@link https://github.com/feross/buffer|Buffer}
     * @param length The zero-padded length of the {@link https://github.com/feross/buffer|Buffer}
     */
  fromBNToBuffer = (bn:BN, length?:number):Buffer => {
    if(typeof bn === "undefined") {
      return undefined;
    }
    const newarr = bn.toArray('be');
    /**
     * CKC: Still unsure why bn.toArray with a "be" and a length do not work right. Bug?
     */
    if (length) { // bn toArray with the length parameter doesn't work correctly, need this.
      const x = length - newarr.length;
      for (let i:number = 0; i < x; i++) {
        newarr.unshift(0);
      }
    }
    return Buffer.from(newarr);
  };

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} and adds a checksum, returning
     * a {@link https://github.com/feross/buffer|Buffer} with the 4-byte checksum appended.
     *
     * @param buff The {@link https://github.com/feross/buffer|Buffer} to append a checksum
     */
  addChecksum = (buff:Buffer):Buffer => {
    const hashslice:Buffer = Buffer.from(createHash('sha256').update(buff).digest().slice(28));
    return Buffer.concat([buff, hashslice]);
  };

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} with an appended 4-byte checksum
     * and returns true if the checksum is valid, otherwise false.
     *
     * @param b The {@link https://github.com/feross/buffer|Buffer} to validate the checksum
     */
  validateChecksum = (buff:Buffer):boolean => {
    const checkslice:Buffer = buff.slice(buff.length - 4);
    const hashslice:Buffer = Buffer.from(createHash('sha256').update(buff.slice(0, buff.length - 4)).digest().slice(28));
    return checkslice.toString('hex') === hashslice.toString('hex');
  };

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string with
     * checksum as per the cb58 standard.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} to serialize
     *
     * @returns A serialized base-58 string of the Buffer.
     */
  cb58Encode = (bytes:Buffer):string => {
    const x:Buffer = this.addChecksum(bytes);
    return this.bufferToB58(x);
  };

  /**
     * Takes a cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
     * and returns a {@link https://github.com/feross/buffer|Buffer} of the original data. Throws on error.
     *
     * @param bytes A cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
     */
  cb58Decode = (bytes:Buffer | string):Buffer => {
    if (typeof bytes === 'string') {
      bytes = this.b58ToBuffer(bytes);
    }
    if (this.validateChecksum(bytes)) {
      return this.copyFrom(bytes, 0, bytes.length - 4);
    }
    throw new Error('Error - BinTools.cb58Decode: invalid checksum');
  };

  addressToString = (hrp:string, chainid:string, bytes:Buffer)
  :string => `${chainid}-${bech32.encode(hrp, bech32.toWords(bytes))}`;

  stringToAddress = (address:string):Buffer => {
    const parts:Array<string> = address.trim().split('-');
    if(parts[1].startsWith("0x") || parts[1].match(/^[0-9A-F]+$/i)){
      return Buffer.from(parts[1].replace("0x", ""), "hex");
    }
    return Buffer.from(bech32.fromWords(bech32.decode(parts[1]).words));
  };

  /**
   * Takes an address and returns its {@link https://github.com/feross/buffer|Buffer}
   * representation if valid. A more strict version of stringToAddress.
   *
   * @param addr A string representation of the address
   * @param blockchainID A cb58 encoded string representation of the blockchainID
   * @param alias A chainID alias, if any, that the address can also parse from.
   * @param addrlen VMs can use any addressing scheme that they like, so this is the appropriate number of address bytes. Default 20.
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid,
   * undefined if not valid.
   */
  parseAddress = (addr:string,
    blockchainID:string,
    alias:string = undefined,
    addrlen:number = 20):Buffer => {
    const abc:Array<string> = addr.split('-');
    if (abc.length === 2 && ((alias && abc[0] === alias) || (blockchainID && abc[0] === blockchainID))) {
        const addrbuff = this.stringToAddress(addr);
        if ((addrlen && addrbuff.length === addrlen) || !(addrlen)) {
          return addrbuff;
        }
    }
    return undefined;
  };
}
