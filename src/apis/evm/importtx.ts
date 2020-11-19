/**
 * @packageDocumentation
 * @module API-EVM-ImportTx
 */

import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { EVMOutput } from './outputs';
import { EVMInput } from './inputs';
import { Tx } from './tx';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

export class ImportTx extends Tx {
  protected sourceChain: Buffer = Buffer.alloc(32);
  protected numImportedInputs: Buffer = Buffer.alloc(4);
  protected importedInputs: EVMInput[];
  protected numouts: Buffer = Buffer.alloc(4);
  protected outs: EVMOutput[];


  /**
   * Returns the sourceChain of the input as {@link https://github.com/feross/buffer|Buffer}
   */ 
  getSourceChain = (): Buffer => this.sourceChain;

  /**
   * Returns the importedIns as an array of [[EVMInputs]]
   */ 
  getImportedIns = (): EVMInput[] => this.importedInputs;

  /**
   * Returns the outs as an array of [[EVMOutputs]]
   */ 
  getOuts = (): EVMOutput[] => this.outs;
 
  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
   */
  toBuffer():Buffer {
    const bsize: number = this.typeid.length + this.networkid.length + this.blockchainid.length + this.sourceChain.length + this.importedInputs.length + this.outs.length;
    const barr: Buffer[] = [this.typeid, this.networkid, this.blockchainid, this.sourceChain];
    const buff: Buffer = Buffer.concat(barr, bsize);
    return buff;
  }

  /**
   * Decodes the [[ImportTx]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.typeid = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.blockchainid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.sourceChain = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    return offset;
  }

  /**
   * Returns a base-58 representation of the [[ImportTx]].
   */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  /**
   * Class representing a ImportTx.
   *
   * @param networkid Optional networkid
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   * @param sourceChain Optional sourceChain, default Buffer.alloc(32, 16)
   * @param importedIns Optional array of the [[EVMInputs]]s
   * @param outs Optional array of the [[EVMOutputs]]s
   */
  constructor(
    networkid: number = undefined, 
    blockchainid: Buffer = Buffer.alloc(32, 16), 
    sourceChain: Buffer = Buffer.alloc(32, 16), 
    importedIns: EVMInput[] = undefined, 
    outs: EVMOutput[] = undefined
  ) {
    super(networkid, blockchainid);
    this.typeid.writeUInt32BE(0, 0);
    this.sourceChain = sourceChain;
    
    if (typeof importedIns !== 'undefined' && typeof outs !== 'undefined') {
      this.numouts.writeUInt32BE(outs.length, 0);
    //   this.outs = outs.sort(StandardTransferableOutput.comparator());
      this.outs = outs;
      this.numImportedInputs.writeUInt32BE(importedIns.length, 0);
      this.importedInputs = importedIns;
    //   this.ins = ins.sort(StandardTransferableInput.comparator());
    }
  }
}  