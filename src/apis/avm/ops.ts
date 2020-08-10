/**
 * @packageDocumentation
 * @module AVMAPI-Operations
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { UTXOID, AVMConstants, SigIdx } from './types';
import { NFTTransferOutput, OutputOwners } from './outputs';
import BN from "bn.js";

const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
export const SelectOperationClass = (opid:number, ...args:Array<any>):Operation => {
    if(opid == AVMConstants.NFTMINTOPID){
        let nftop:NFTMintOperation = new NFTMintOperation(...args);
        return nftop;
    } else if(opid == AVMConstants.NFTXFEROP){
        let nftop:NFTTransferOperation = new NFTTransferOperation(...args);
        return nftop;
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

  getCredentialID = ():number => AVMConstants.NFTCREDENTIAL;

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
 * A [[Operation]] class which specifies a NFT Mint Op.
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
     * Returns the payload.
     */
    getPayload = ():Buffer => {
        return this.payload;
    }

    /**
     * Returns the outputOwners.
     */
    getOutputOwners = ():Array<OutputOwners> => {
        return this.outputOwners;
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the size of the output.
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
            let locktime:BN = bintools.fromBufferToBN(bintools.copyFrom(bytes, offset, offset + 8));
            offset += 8;
            let threshold:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
            offset += 4;
            let numaddrs:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
            offset += 4;
            let addrs:Array<Buffer> = [];
            for(let j:number = 0; j < numaddrs; j++) {
                let addr:Buffer = bintools.copyFrom(bytes, offset, offset + 20);
                addrs.push(addr);
                offset += 20;
            }
            let outputOwner:OutputOwners = new OutputOwners(addrs, locktime, threshold);
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
    return AVMConstants.NFTXFEROP;
  }

  getOutput = ():NFTTransferOutput => this.output;

  /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the size of the output.
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
