/**
 * @packageDocumentation
 * @module API-EVM-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { off } from 'process';
import { EVMOutput } from './outputs';

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
  protected output: EVMOutput = undefined;

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
    // outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
    const barr: Buffer[] = [this.codecid, this.txid, this.outputidx, this.assetid, outputidbuffer, outbuff];
    return Buffer.concat(barr, 
      this.codecid.length + this.txid.length 
      + this.outputidx.length + this.assetid.length
      + outputidbuffer.length + outbuff.length);
  }
}
