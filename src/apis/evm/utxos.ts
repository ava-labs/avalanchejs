/**
 * @packageDocumentation
 * @module API-EVM-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { off } from 'process';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Class for representing a single UTXO.
 */
export class EVMUTXO {
  protected codecid: Buffer = Buffer.alloc(2);
  protected txid: Buffer = Buffer.alloc(32);
  protected outputidx: Buffer = Buffer.alloc(4);
  protected assetid: Buffer = Buffer.alloc(32);
//   protected output: Output = undefined;

  /**
   * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
   *
   * @param serialized A base-58 string containing a raw [[UTXO]]
   *
   * @returns The length of the raw [[UTXO]]
   *
   * @remarks
   * unlike most fromStrings, it expects the string to be serialized in cb58 format
   */
  fromString(serialized: string): number {
    /* istanbul ignore next */
    return this.fromBuffer(bintools.cb58Decode(serialized));
  }

  /**
   * Returns a base-58 representation of the [[UTXO]].
   *
   * @remarks
   * unlike most toStrings, this returns in cb58 serialization format
   */
  toString(): string {
    /* istanbul ignore next */
    return bintools.cb58Encode(this.toBuffer());
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.codecid = bintools.copyFrom(bytes, offset, offset + 2);
    offset += 2;
    this.txid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    const outputid: number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    // this.output = SelectOutputClass(outputid);
    // return this.output.fromBuffer(bytes, offset);
    return offset;
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[UTXO]].
    */
  toBuffer(): Buffer {
    const outbuff: Buffer = this.output.toBuffer();
    const outputidbuffer: Buffer = Buffer.alloc(4);
    outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
    const barr: Buffer[] = [this.codecid, this.txid, this.outputidx, this.assetid, outputidbuffer, outbuff];
    return Buffer.concat(barr, 
      this.codecid.length + this.txid.length 
      + this.outputidx.length + this.assetid.length
      + outputidbuffer.length + outbuff.length);
  }
}

// * codec id: 00 00
// * txid: 09 b1 44 1f d8 1f b5 6e 11 ff f8 92 3b 9b ae e5 cb a4 9d 51 07 b6 bb 77 8c 5c 38 16 2d fc a4 f3
// * output index: 00 00 00 01
// * asset id: db cf 89 0f 77 f4 9b 96 85 76 48 b7 2b 77 f9 f8 29 37 f2 8a 68 70 4a f0 5d a0 dc 12 ba 53 f2 db
// * Output:
// * type id: 00 00 00 07
// * amount: 00 00 03 a3 52 a3 82 40
// * locktime: 00 00 00 00 00 00 00 00
// * threshold: 00 00 00 01
// * num addrs: 00 00 00 01
// * addrs[0]: 3c b7 d3 84 2e 8c ee 6a 0e bd 09 f1 fe 88 4f 68 61 e1 b2 9c
