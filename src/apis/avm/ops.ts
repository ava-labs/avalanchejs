/**
 * @packageDocumentation
 * @module API-AVM-Operations
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { AVMConstants } from './constants';
import { NFTTransferOutput, SECPMintOutput, SECPTransferOutput } from './outputs';
import BN from "bn.js";
import { NBytes } from '../../common/nbytes';
import { SigIdx } from '../../common/credentials';
import { OutputOwners } from '../../common/output';

const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
export const SelectOperationClass = (opid:number, ...args:Array<any>):Operation => {
    if(opid == AVMConstants.SECPMINTOPID) {
      return new SECPMintOperation(...args);
    } else if(opid == AVMConstants.NFTMINTOPID){
      return new NFTMintOperation(...args);
    } else if(opid == AVMConstants.NFTXFEROPID){
      return new NFTTransferOperation(...args);
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectOperationClass: unknown opid " + opid);
}

/**
 * A class representing an operation. All operation types must extend on this class.
 */
export abstract class Operation {
  protected sigCount:Buffer = Buffer.alloc(4);

  protected sigIdxs:Array<SigIdx> = []; // idxs of signers from utxo

  abstract getOperationID():number;

  /**
     * Returns the array of [[SigIdx]] for this [[Operation]]
     */
  getSigIdxs = ():Array<SigIdx> => this.sigIdxs;

  /**
   * Returns the credential ID.
   */
  abstract getCredentialID():number;

  /**
     * Creates and adds a [[SigIdx]] to the [[Operation]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
  addSignatureIdx = (addressIdx:number, address:Buffer) => {
    const sigidx:SigIdx = new SigIdx();
    const b:Buffer = Buffer.alloc(4);
    b.writeUInt32BE(addressIdx, 0);
    sigidx.fromBuffer(b);
    sigidx.setSource(address);
    this.sigIdxs.push(sigidx);
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
  };

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    const sigCount:number = this.sigCount.readUInt32BE(0);
    this.sigIdxs = [];
    for (let i:number = 0; i < sigCount; i++) {
      const sigidx:SigIdx = new SigIdx();
      const sigbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
      sigidx.fromBuffer(sigbuff);
      offset += 4;
      this.sigIdxs.push(sigidx);
    }
    return offset;
  }

  toBuffer():Buffer {
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    let bsize:number = this.sigCount.length;
    const barr:Array<Buffer> = [this.sigCount];
    for (let i = 0; i < this.sigIdxs.length; i++) {
      const b:Buffer = this.sigIdxs[i].toBuffer();
      barr.push(b);
      bsize += b.length;
    }
    return Buffer.concat(barr, bsize);
  }

  /**
   * Returns a base-58 string representing the [[NFTMintOperation]].
   */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  static comparator = ():(a:Operation, b:Operation) => (1|-1|0) => (a:Operation, b:Operation):(1|-1|0) => {
    const aoutid:Buffer = Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOperationID(), 0);
    const abuff:Buffer = a.toBuffer();

    const boutid:Buffer = Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOperationID(), 0);
    const bbuff:Buffer = b.toBuffer();

    const asort:Buffer = Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort:Buffer = Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return Buffer.compare(asort, bsort) as (1|-1|0);
  };

  constructor() {}
}

/**
 * A class which contains an [[Operation]] for transfers.
 *
 */
export class TransferableOperation {
  protected assetid:Buffer = Buffer.alloc(32);

  protected utxoIDs:Array<UTXOID> = [];

  protected operation:Operation;

    /**
     * Returns a function used to sort an array of [[TransferableOperation]]s
     */
    static comparator = ():(a:TransferableOperation, b:TransferableOperation) => (1|-1|0) => {
        return function(a:TransferableOperation, b:TransferableOperation):(1|-1|0) { 
            return Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);
        }
    }

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    const numutxoIDs:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.utxoIDs = [];
    for (let i = 0; i < numutxoIDs; i++) {
      const utxoid:UTXOID = new UTXOID();
      offset = utxoid.fromBuffer(bytes, offset);
      this.utxoIDs.push(utxoid);
    }
    const opid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.operation = SelectOperationClass(opid);
    return this.operation.fromBuffer(bytes, offset);
  }

  toBuffer():Buffer {
    const numutxoIDs = Buffer.alloc(4);
    numutxoIDs.writeUInt32BE(this.utxoIDs.length, 0);
    let bsize:number = this.assetid.length + numutxoIDs.length;
    const barr:Array<Buffer> = [this.assetid, numutxoIDs];
    this.utxoIDs = this.utxoIDs.sort(UTXOID.comparator());
    for (let i = 0; i < this.utxoIDs.length; i++) {
      const b:Buffer = this.utxoIDs[i].toBuffer();
      barr.push(b);
      bsize += b.length;
    }
    const opid:Buffer = Buffer.alloc(4);
    opid.writeUInt32BE(this.operation.getOperationID(), 0);
    barr.push(opid);
    bsize += opid.length;
    const b:Buffer = this.operation.toBuffer();
    bsize += b.length;
    barr.push(b);
    return Buffer.concat(barr, bsize);
  }

  /**
   * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
   */
  getAssetID = ():Buffer => this.assetid;

  /**
   * Returns an array of UTXOIDs in this operation.
   */
  getUTXOIDs = ():Array<UTXOID> => this.utxoIDs;

  /**
   * Returns the operation
   */
  getOperation = ():Operation => this.operation;

  constructor(assetid:Buffer = undefined, utxoids:Array<UTXOID|string|Buffer> = undefined, operation:Operation = undefined) {
    if (
      typeof assetid !== 'undefined' && assetid.length === AVMConstants.ASSETIDLEN
            && operation instanceof Operation && typeof utxoids !== 'undefined'
            && Array.isArray(utxoids)
    ) {
      this.assetid = assetid;
      this.operation = operation;
      for (let i = 0; i < utxoids.length; i++) {
        const utxoid:UTXOID = new UTXOID();
        if (typeof utxoids[i] === 'string') {
          utxoid.fromString(utxoids[i] as string);
        } else if (utxoids[i] instanceof Buffer) {
          utxoid.fromBuffer(utxoids[i] as Buffer);
        } else if (utxoids[i] instanceof UTXOID) {
          utxoid.fromString(utxoids[i].toString()); // clone
        }
        this.utxoIDs.push(utxoid);
      }
    }
  }
}

/**
 * An [[Operation]] class which specifies a SECP256k1 Mint Op.
 */
export class SECPMintOperation extends Operation {
  protected mintOutput:SECPMintOutput = undefined;
  protected transferOutputs:Array<SECPTransferOutput> = [];

  /**
   * Returns the operation ID.
   */
  getOperationID():number {
    return AVMConstants.SECPMINTOPID;
  }

  /**
   * Returns the credential ID.
   */
  getCredentialID():number {
    return AVMConstants.SECPCREDENTIAL;
  }

  /**
   * Returns the [[SECPMintOutput]] to be produced by this operation.
   */
  getMintOutput():SECPMintOutput {
    return this.mintOutput;
  }

  /**
   * Returns the array of [[SECPTransferOutput]]s to be produced by this operation.
   */
  getTransferOutputs():Array<SECPTransferOutput> {
    return this.transferOutputs;
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SECPMintOperation]] and returns the updated offset.
   */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    offset = super.fromBuffer(bytes, offset);
    this.mintOutput = new SECPMintOutput();
    offset = this.mintOutput.fromBuffer(bytes, offset);
    let numoutputs:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.transferOutputs = [];
    for(let i:number = 0; i < numoutputs; i++) {
      let transferOut:SECPTransferOutput = new SECPTransferOutput();
      offset = transferOut.fromBuffer(bytes, offset);
      this.transferOutputs.push(transferOut);
    }
    return offset;
  }

  /**
   * Returns the buffer representing the [[SECPMintOperation]] instance.
   */
  toBuffer():Buffer {
    let superbuff:Buffer = super.toBuffer();
    let mintoutBuff:Buffer = this.mintOutput.toBuffer();
    let bsize:number = 
      superbuff.length + 
      mintoutBuff.length; 

    let barr:Array<Buffer> = [
      superbuff, 
      mintoutBuff
    ];

    for(let i = 0; i < this.transferOutputs.length; i++) {
      let b:Buffer = this.transferOutputs[i].toBuffer();
      barr.push(b);
      bsize += b.length;
    }

    return Buffer.concat(barr,bsize);
  }

  /**
   * An [[Operation]] class which mints new tokens on an assetID.
   * 
   * @param mintOutput The [[SECPMintOutput]] that will be produced by this transaction.
   * @param transferOutputs An array of [[SECPTransferOutput]]s that will be produced from this minting operation.
   */
  constructor(mintOutput:SECPMintOutput = undefined, transferOutputs:Array<SECPTransferOutput> = undefined){
    super();
    if(typeof mintOutput !== 'undefined') {
      this.mintOutput = mintOutput;
    } 
    if(typeof transferOutputs !== 'undefined' && transferOutputs.length) {
        this.transferOutputs = transferOutputs;
    }
  }

}

/**
 * An [[Operation]] class which specifies a NFT Mint Op.
 */
export class NFTMintOperation extends Operation {
  protected groupID:Buffer = Buffer.alloc(4);
  protected payload:Buffer;
  protected outputOwners:Array<OutputOwners> = [];

  /**
   * Returns the operation ID.
   */
  getOperationID():number {
    return AVMConstants.NFTMINTOPID;
  }

  /**
   * Returns the credential ID.
   */
  getCredentialID():number {
    return AVMConstants.NFTCREDENTIAL;
  }

  /**
   * Returns the payload.
   */
  getPayload = ():Buffer => {
    return bintools.copyFrom(this.payload, 0);
  }

  /**
   * Returns the payload's raw {@link https://github.com/feross/buffer|Buffer} with length prepended, for use with [[PayloadBase]]'s fromBuffer
   */
  getPayloadBuffer = ():Buffer => {
    let payloadlen:Buffer = Buffer.alloc(4);
    payloadlen.writeUInt32BE(this.payload.length, 0);
    return Buffer.concat([payloadlen, bintools.copyFrom(this.payload, 0)]);
  }

  /**
   * Returns the outputOwners.
   */
  getOutputOwners = ():Array<OutputOwners> => {
    return this.outputOwners;
  }

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the updated offset.
   */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    offset = super.fromBuffer(bytes, offset);
    this.groupID = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    let payloadLen:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.payload = bintools.copyFrom(bytes, offset, offset + payloadLen);
    offset += payloadLen;
    let numoutputs:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.outputOwners = [];
    for(let i:number = 0; i < numoutputs; i++) {
      let outputOwner:OutputOwners = new OutputOwners();
      offset = outputOwner.fromBuffer(bytes, offset);
      this.outputOwners.push(outputOwner);
    }
    return offset;
  }

  /**
   * Returns the buffer representing the [[NFTMintOperation]] instance.
   */
  toBuffer():Buffer {
    let superbuff:Buffer = super.toBuffer();
    let payloadlen:Buffer = Buffer.alloc(4);
    payloadlen.writeUInt32BE(this.payload.length, 0);

    let outputownerslen:Buffer = Buffer.alloc(4);
    outputownerslen.writeUInt32BE(this.outputOwners.length, 0);

    let bsize:number = 
      superbuff.length + 
      this.groupID.length + 
      payloadlen.length + 
      this.payload.length +
      outputownerslen.length; 

    let barr:Array<Buffer> = [
      superbuff, 
      this.groupID,
      payloadlen,
      this.payload, 
      outputownerslen
    ];

    for(let i = 0; i < this.outputOwners.length; i++) {
      let b:Buffer = this.outputOwners[i].toBuffer();
      barr.push(b);
      bsize += b.length;
    }

    return Buffer.concat(barr,bsize);
  }

  /**
   * Returns a base-58 string representing the [[NFTMintOperation]].
   */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  /**
   * An [[Operation]] class which contains an NFT on an assetID.
   * 
   * @param groupID The group to which to issue the NFT Output
   * @param payload A {@link https://github.com/feross/buffer|Buffer} of the NFT payload
   * @param outputOwners An array of outputOwners
   */
  constructor(groupID:number = undefined, payload:Buffer = undefined, outputOwners:Array<OutputOwners> = undefined){
    super();
    if(typeof groupID !== 'undefined' && typeof payload !== 'undefined' && outputOwners.length) {
      this.groupID.writeUInt32BE((groupID ? groupID : 0), 0);
      this.payload = payload;
      this.outputOwners = outputOwners;
    }
  }
}

/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
export class NFTTransferOperation extends Operation {
  protected output:NFTTransferOutput;

  /**
   * Returns the operation ID.
   */
  getOperationID():number {
    return AVMConstants.NFTXFEROPID;
  }

  /**
   * Returns the credential ID.
   */
  getCredentialID():number {
    return AVMConstants.NFTCREDENTIAL;
  }

  getOutput = ():NFTTransferOutput => this.output;

  /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the updated offset.
     */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    offset = super.fromBuffer(bytes, offset);
    this.output = new NFTTransferOutput();
    return this.output.fromBuffer(bytes, offset);
  }

  /**
     * Returns the buffer representing the [[NFTTransferOperation]] instance.
     */
  toBuffer():Buffer {
    const superbuff:Buffer = super.toBuffer();
    const outbuff:Buffer = this.output.toBuffer();
    const bsize:number = superbuff.length + outbuff.length;
    const barr:Array<Buffer> = [superbuff, outbuff];
    return Buffer.concat(barr, bsize);
  }

  /**
     * Returns a base-58 string representing the [[NFTTransferOperation]].
     */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param output An [[NFTTransferOutput]]
     */
  constructor(output:NFTTransferOutput = undefined) {
    super();
    if (typeof output !== 'undefined') {
      this.output = output;
    }
  }
}

/**
 * CKC - Make generic, use everywhere.
 */

/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
export class UTXOID extends NBytes {
  /**
     * Returns a function used to sort an array of [[UTXOID]]s
     */
  static comparator = ():(a:UTXOID, b:UTXOID) => (1|-1|0) => (a:UTXOID, b:UTXOID)
    :(1|-1|0) => Buffer.compare(a.toBuffer(), b.toBuffer()) as (1|-1|0);

  /**
     * Returns a base-58 representation of the [[UTXOID]].
     */
  toString():string {
    return bintools.cb58Encode(this.toBuffer());
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

  clone():this {
    let newbase:UTXOID = new UTXOID();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
    return new UTXOID() as this;
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