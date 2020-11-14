/**
 * @packageDocumentation
 * @module API-EVM-ExportTx
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { EVMOutput } from './outputs';
import { EVMInput } from './inputs';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

export class ExportTx {
  protected typeid: Buffer = Buffer.alloc(4); 
  protected networkid: Buffer = Buffer.alloc(4); 
  protected blockchainid: Buffer = Buffer.alloc(32);
  protected destinationChain: Buffer = Buffer.alloc(32);
  protected numInputs: Buffer = Buffer.alloc(4);
  protected inputs: EVMInput[];
  protected numExportedOutputs: Buffer = Buffer.alloc(4);
  protected exportedOutputs: EVMOutput[];

  /**
   * Returns the typeid of the input as {@link https://github.com/feross/buffer|Buffer}
   */
  getTypeID = (): Buffer => this.typeid;

  /**
   * Returns the networkid as a {@link https://github.com/feross/buffer|Buffer}.
   */
  getNetworkID = (): Buffer => this.networkid;

  /**
   * Returns the blockchainid of the input as {@link https://github.com/feross/buffer|Buffer}
   */ 
  getBlockchainID = (): Buffer => this.blockchainid;

  /**
   * Returns the destinationChain of the input as {@link https://github.com/feross/buffer|Buffer}
   */ 
  getDestinationChain = (): Buffer => this.destinationChain;

  /**
   * Returns the inputs as an array of [[EVMInputs]]
   */ 
  getInputs = (): EVMInput[] => this.inputs;

  /**
   * Returns the outs as an array of [[EVMOutputs]]
   */ 
  getExportedOutputs = (): EVMOutput[] => this.exportedOutputs;
 
  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
   */
  toBuffer():Buffer {
    const bsize: number = this.typeid.length + this.networkid.length + this.blockchainid.length + this.destinationChain.length + this.inputs.length + this.exportedOutputs.length;
    const barr: Buffer[] = [this.typeid, this.networkid, this.blockchainid, this.destinationChain];
    const buff: Buffer = Buffer.concat(barr, bsize);
    return buff;
  }

  /**
   * Decodes the [[ExportTx]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.typeid = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.blockchainid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.destinationChain = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    return offset;
  }

  /**
   * Returns a base-58 representation of the [[ExportTx]].
   */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  /**
   * Class representing a ExportTx.
   *
   * @param networkid Optional networkid
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   * @param destinationChain Optional destinationChain, default Buffer.alloc(32, 16)
   * @param inputs Optional array of the [[EVMInputs]]s
   * @param exportedOutputs Optional array of the [[EVMOutputs]]s
   */
  constructor(networkid: number = undefined, blockchainid: Buffer = Buffer.alloc(32, 16), destinationChain: Buffer = Buffer.alloc(32, 16), inputs: EVMInput[] = undefined, exportedOutputs: EVMOutput[] = undefined) {
    this.typeid.writeUInt32BE(1, 0);
    this.networkid.writeUInt32BE(networkid, 0);
    this.blockchainid = blockchainid;
    this.destinationChain = destinationChain;
    
    if (typeof inputs !== 'undefined' && typeof exportedOutputs !== 'undefined') {
      this.numExportedOutputs.writeUInt32BE(exportedOutputs.length, 0);
    //   this.outs = outs.sort(StandardTransferableOutput.comparator());
      this.exportedOutputs = exportedOutputs;
      this.numInputs.writeUInt32BE(inputs.length, 0);
      this.inputs = inputs;
    //   this.ins = ins.sort(StandardTransferableInput.comparator());
    }
  }
}  