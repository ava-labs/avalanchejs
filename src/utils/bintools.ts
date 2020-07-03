/**
 * @packageDocumentation
 * @module Utils-BinTools
 */
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import createHash from 'create-hash';

/**
 * A Base58 class that uses the cross-platform Buffer module. Built so that Typescript
 * will accept the code.
 *
 * ```js
 * let b58:Base58 = new Base58();
 * let str:string = b58.encode(somebuffer);
 * let buff:Buffer = b58.decode(somestring);
 * ```
 */
export class Base58 {
  protected b58alphabet:string = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  protected alphabetIdx0 = '1';

  protected b58 = [
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 0, 1, 2, 3, 4, 5, 6,
    7, 8, 255, 255, 255, 255, 255, 255,
    255, 9, 10, 11, 12, 13, 14, 15,
    16, 255, 17, 18, 19, 20, 21, 255,
    22, 23, 24, 25, 26, 27, 28, 29,
    30, 31, 32, 255, 255, 255, 255, 255,
    255, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 255, 44, 45, 46,
    47, 48, 49, 50, 51, 52, 53, 54,
    55, 56, 57, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255,
  ];

  protected big58Radix:BN = new BN(58);

  protected bigZero:BN = new BN(0);

  /**
     * Encodes a {@link https://github.com/feross/buffer|Buffer} as a base-58 string
     *
     * @param buff A {@link https://github.com/feross/buffer|Buffer} to encode
     *
     * @returns A base-58 string.
     */
  encode = (buff:Buffer):string => {
    let x:BN = new BN(buff.toString('hex'), 'hex', 'be');
    let answer:string = '';// = Buffer.alloc(buff.length*136/100, 0);
    while (x.cmp(this.bigZero) > 0) {
      const mod:BN = x.mod(this.big58Radix);
      x = x.div(this.big58Radix);
      answer += this.b58alphabet[mod.toNumber()];
    }

    for (let i:number = 0; i < buff.length; i++) {
      if (buff.readUInt8(i) !== 0) {
        break;
      }
      answer += this.alphabetIdx0;
    }
    return answer.split('').reverse().join('');
  };

  /**
     * Dencodes a base-58 into a {@link https://github.com/feross/buffer|Buffer}
     *
     * @param b A base-58 string to decode
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} from the decoded string.
     */
  decode = (b:string):Buffer => {
    const answer:BN = new BN(0);
    const j:BN = new BN(1);

    for (let i:number = b.length - 1; i >= 0; i--) {
      const tmp:number = this.b58[b.charCodeAt(i)];
      if (tmp === 255) {
        throw new Error('Error - Base58.decode: not a valid base58 string');
      }
      const scratch:BN = new BN(tmp);
      scratch.imul(j);
      answer.iadd(scratch);
      j.imul(this.big58Radix);
    }

    let anshex = answer.toString('hex');
    anshex = anshex.length % 2 ? `0${anshex}` : anshex;

    const tmpval:Buffer = Buffer.from(anshex, 'hex');
    let numZeros:number;
    for (numZeros = 0; numZeros < b.length; numZeros++) {
      if (b[numZeros] !== this.alphabetIdx0) {
        break;
      }
    }
    const xlen:number = numZeros + tmpval.length;
    const result:Buffer = Buffer.alloc(xlen, 0);
    tmpval.copy(result, numZeros);

    return result;
  };
}

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
    this.b58 = new Base58();
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
     * Produces a string from a {@link https://github.com/feross/buffer|Buffer}
     * representing a string.
     *
     * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to a string
     */
  bufferToString = (buff:Buffer):string => this.copyFrom(buff, 2).toString('utf8');

  /**
     * Produces a {@link https://github.com/feross/buffer|Buffer} from a string.
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
    let theEnd = end;
    if (end === undefined) {
      theEnd = buff.length;
    }
    return Buffer.from(Uint8Array.prototype.slice.call(buff.slice(start, theEnd)));
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
  fromBufferToBN = (buff:Buffer):BN => new BN(buff.toString('hex'), 16, 'be');

  /**
     * Takes a {@link https://github.com/indutny/bn.js/|BN} and converts it
     * to a {@link https://github.com/feross/buffer|Buffer}.
     *
     * @param bn The {@link https://github.com/indutny/bn.js/|BN} to convert
     * to a {@link https://github.com/feross/buffer|Buffer}
     * @param length The zero-padded length of the {@link https://github.com/feross/buffer|Buffer}
     */
  fromBNToBuffer = (bn:BN, length?:number):Buffer => {
    const newarr = bn.toArray('be');
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
    const hashslice:Buffer = Buffer.from(createHash('sha256')
      .update(buff.slice(0, buff.length - 4)).digest().slice(28));
    return checkslice.toString('hex') === hashslice.toString('hex');
  };

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string with
     * checksum as per the AVA standard.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} to serialize
     *
     * @returns A serialized base-58 strig of the Buffer.
     */
  avaSerialize = (bytes:Buffer):string => {
    const x:Buffer = this.addChecksum(bytes);
    return this.bufferToB58(x);
  };

  /**
     * Takes an AVA serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
     * and returns a {@link https://github.com/feross/buffer|Buffer} of the original data. Throws on error.
     *
     * @param bytes An AVA serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
     */
  avaDeserialize = (bytes:Buffer | string):Buffer => {
    if (typeof bytes === 'string') {
      bytes = this.b58ToBuffer(bytes);
    }
    if (this.validateChecksum(bytes)) {
      return this.copyFrom(bytes, 0, bytes.length - 4);
    }
    throw new Error('Error - BinTools.avaDeserialize: invalid checksum');
  };

  addressToString = (chainid:string, bytes:Buffer)
  :string => `${chainid}-${this.avaSerialize(bytes)}`;

  stringToAddress = (address:string):Buffer => {
    const parts:Array<string> = address.split('-');
    return this.avaDeserialize(parts[1]);
  };

  /**
     * Takes an address and returns its {@link https://github.com/feross/buffer|Buffer}
     * representation if valid.
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid,
     * undefined if not valid.
     */
  parseAddress = (addr:string,
    blockchainID:string,
    alias:string = undefined,
    addrlen:number = 20):Buffer => {
    const abc:Array<string> = addr.split('-');
    if (abc.length === 2) {
      if ((alias && abc[0] === alias) || (blockchainID && abc[0] === blockchainID)) {
        const addrbuff = this.avaDeserialize(abc[1]);
        if ((addrlen && addrbuff.length === addrlen) || !(addrlen)) {
          return addrbuff;
        }
      }
    }
    return undefined;
  };
}
