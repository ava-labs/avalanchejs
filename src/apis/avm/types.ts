/**
 * @packageDocumentation
 * @module AVMAPI-Types
 */
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from '../../utils/bintools';

import { NBytes } from '../../utils/types';
import { Output, SelectOutputClass } from './outputs';

/**
 * @ignore
 */
const bintools:BinTools = BinTools.getInstance();

export class AVMConstants {
  static SECPFXID:number = 0;

  static SECPOUTPUTID:number = 7;

  static NFTXFEROUTPUTID:number = 11;

  static SECPINPUTID:number = 5;

  static NFTXFEROP:number = 13;

  static BASETX:number = 0;

  static CREATEASSETTX:number = 1;

  static OPERATIONTX:number = 2;

  static SECPCREDENTIAL:number = 9;

  static NFTCREDENTIAL:number = 16;

  static ASSETIDLEN:number = 32;

  static BLOCKCHAINIDLEN:number = 32;

  static SYMBOLMAXLEN:number = 4;

  static ASSETNAMELEN:number = 128;

  static ADDRESSLENGTH:number = 20;
}

/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
export class SigIdx extends NBytes {
  source:Buffer;

  /**
     * Sets the source address for the signature
     */
  setSource = (address:Buffer) => {
    this.source = address;
  };

  /**
     * Retrieves the source address for the signature
     */
  getSource = ():Buffer => this.source;

  /**
     * Type representing a [[Signature]] index used in [[Input]]
     */
  constructor() {
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
  constructor() {
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
  static comparitor = ()
    :(a:Address, b:Address) => (1|-1|0) => (a:Address, b:Address)
    :(1|-1|0) => Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);

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
    const addrbuff:Buffer = bintools.b58ToBuffer(addr);
    if (addrbuff.length === 24 && bintools.validateChecksum(addrbuff)) {
      const newbuff:Buffer = bintools.copyFrom(addrbuff, 0, addrbuff.length - 4);
      if (newbuff.length === 20) {
        this.bytes = newbuff;
      }
    } else if (addrbuff.length === 24) {
      throw new Error('Error - Address.fromString: invalid checksum on address');
    } else if (addrbuff.length === 20) {
      this.bytes = addrbuff;
    } else {
      /* istanbul ignore next */
      throw new Error('Error - Address.fromString: invalid address');
    }
    return this.getSize();
  }

  /**
     * Class for representing an address used in [[Output]] types
     */
  constructor() {
    super();
    this.bytes = Buffer.alloc(20);
    this.bsize = 20;
  }
}

/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
export class UTXOID extends NBytes {
  /**
     * Returns a function used to sort an array of [[UTXOID]]s
     */
  static comparitor = ():(a:UTXOID, b:UTXOID) => (1|-1|0) => (a:UTXOID, b:UTXOID)
    :(1|-1|0) => Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);

  /**
     * Returns a base-58 representation of the [[UTXOID]].
     */
  toString():string {
    return bintools.avaSerialize(this.toBuffer());
  }

  /**
     * Takes a base-58 string containing an [[UTXOID]], parses it, populates the class, and returns the length of the UTXOID in bytes.
     *
     * @param bytes A base-58 string containing a raw [[UTXOID]]
     *
     * @returns The length of the raw [[UTXOID]]
     */
  fromString(utxoid:string):number {
    const utxoidbuff:Buffer = bintools.b58ToBuffer(utxoid);
    if (utxoidbuff.length === 40 && bintools.validateChecksum(utxoidbuff)) {
      const newbuff:Buffer = bintools.copyFrom(utxoidbuff, 0, utxoidbuff.length - 4);
      if (newbuff.length === 36) {
        this.bytes = newbuff;
      }
    } else if (utxoidbuff.length === 40) {
      throw new Error('Error - UTXOID.fromString: invalid checksum on address');
    } else if (utxoidbuff.length === 36) {
      this.bytes = utxoidbuff;
    } else {
      /* istanbul ignore next */
      throw new Error('Error - UTXOID.fromString: invalid address');
    }
    return this.getSize();
  }

  /**
     * Class for representing a UTXOID used in [[TransferableOp]] types
     */
  constructor() {
    super();
    this.bytes = Buffer.alloc(36);
    this.bsize = 36;
  }
}

/**
 * Class for creating initial output states used in asset creation
 */
export class InitialStates {
  protected fxs:{[fxid:number]:Array<Output>} = {};

  /**
     *
     * @param out The output state to add to the collection
     * @param fxid The FxID that will be used for this output, default AVMConstants.SECPFXID
     */
  addOutput(out:Output, fxid:number = AVMConstants.SECPFXID):void {
    if (!(fxid in this.fxs)) {
      this.fxs[fxid] = [];
    }
    this.fxs[fxid].push(out);
  }

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    const result:{[fxid:number]:Array<Output>} = [];
    const klen:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    const klennum:number = klen.readUInt32BE(0);
    for (let i = 0; i < klennum; i++) {
      const fxidbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
      offset += 4;
      const fxid:number = fxidbuff.readUInt32BE(0);
      result[fxid] = [];
      const statelenbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
      offset += 4;
      const statelen:number = statelenbuff.readUInt32BE(0);
      for (let j = 0; j < statelen; j++) {
        const outputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        const out:Output = SelectOutputClass(outputid);
        offset = out.fromBuffer(bytes, offset);
        result[fxid].push(out);
      }
    }
    this.fxs = result;
    return offset;
  }

  toBuffer():Buffer {
    const buff:Array<Buffer> = [];
    const keys:Array<number> = Object.keys(this.fxs).map((k) => parseInt(k, 10)).sort();
    const klen:Buffer = Buffer.alloc(4);
    klen.writeUInt32BE(keys.length, 0);
    buff.push(klen);
    for (let i = 0; i < keys.length; i++) {
      const fxid:number = keys[i];
      const fxidbuff:Buffer = Buffer.alloc(4);
      fxidbuff.writeUInt32BE(fxid, 0);
      buff.push(fxidbuff);
      const initialState = this.fxs[fxid].sort(Output.comparator());
      const statelen:Buffer = Buffer.alloc(4);
      statelen.writeUInt32BE(initialState.length, 0);
      buff.push(statelen);
      for (let j = 0; j < initialState.length; j++) {
        const outputid:Buffer = Buffer.alloc(4);
        outputid.writeInt32BE(initialState[j].getOutputID(), 0);
        buff.push(outputid);
        buff.push(initialState[j].toBuffer());
      }
    }
    return Buffer.concat(buff);
  }

  constructor() {}
}

/**
 * Rules used when merging sets
 */
export type MergeRule = 'intersection' // Self INTERSECT New
| 'differenceSelf' // Self MINUS New
| 'differenceNew' // New MINUS Self
| 'symDifference' // differenceSelf UNION differenceNew
| 'union' // Self UNION New
| 'unionMinusNew' // union MINUS differenceNew
| 'unionMinusSelf' // union MINUS differenceSelf
| 'ERROR'; // generate error for testing

/**
 * Function providing the current UNIX time using a {@link https://github.com/indutny/bn.js/|BN}
 */
export function UnixNow():BN {
  return new BN(Math.round((new Date()).getTime() / 1000));
}
