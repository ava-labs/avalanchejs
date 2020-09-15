/**
 * @packageDocumentation
 * @module Common-Inputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../utils/bintools';
import BN from 'bn.js';
import { SigIdx } from './credentials';
import { Serializable } from '../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();


export abstract class Input extends Serializable {
  protected type = "Input";
  protected typeID = undefined;

  protected sigCount:Buffer = Buffer.alloc(4);
  protected sigIdxs:Array<SigIdx> = []; // idxs of signers from utxo

  static comparator = ():(a:Input, b:Input) => (1|-1|0) => (a:Input, b:Input):(1|-1|0) => {
    const aoutid:Buffer = Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getInputID(), 0);
    const abuff:Buffer = a.toBuffer();

    const boutid:Buffer = Buffer.alloc(4);
    boutid.writeUInt32BE(b.getInputID(), 0);
    const bbuff:Buffer = b.toBuffer();

    const asort:Buffer = Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort:Buffer = Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return Buffer.compare(asort, bsort) as (1|-1|0);
  };

  abstract getInputID():number;

  /**
   * Returns the array of [[SigIdx]] for this [[Input]]
   */
  getSigIdxs = ():Array<SigIdx> => this.sigIdxs;

  abstract getCredentialID():number;

  /**
   * Creates and adds a [[SigIdx]] to the [[Input]].
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
    for (let i = 0; i < sigCount; i++) {
      const sigidx = new SigIdx();
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
   * Returns a base-58 representation of the [[Input]].
   */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  abstract clone():this;

  abstract create(...args:any[]):this;

  abstract select(id:number, ...args:any[]):Input;
  
}

export abstract class StandardTransferableInput extends Serializable{
  protected type = "StandardTransferableInput";
  protected typeID = undefined;

  protected txid:Buffer = Buffer.alloc(32);
  protected outputidx:Buffer = Buffer.alloc(4);
  protected assetid:Buffer = Buffer.alloc(32);
  protected input:Input;

  /**
   * Returns a function used to sort an array of [[StandardTransferableInput]]s
   */
  static comparator = ():(a:StandardTransferableInput, b:StandardTransferableInput) => (1|-1|0) => (a:StandardTransferableInput, b:StandardTransferableInput):(1|-1|0) => {
    const sorta = Buffer.concat([a.getTxID(), a.getOutputIdx()]);
    const sortb = Buffer.concat([b.getTxID(), b.getOutputIdx()]);
    return Buffer.compare(sorta, sortb) as (1|-1|0);
  };

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
   */
  getTxID = ()
  /* istanbul ignore next */
  :Buffer => this.txid;

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
   */
  getOutputIdx = ()
  /* istanbul ignore next */
  :Buffer => this.outputidx;

  /**
   * Returns a base-58 string representation of the UTXOID this [[StandardTransferableInput]] references.
   */
  getUTXOID = ():string => bintools.bufferToB58(Buffer.concat([this.txid, this.outputidx]));

  /**
   * Returns the input.
   */
  getInput = ():Input => this.input;

  /**
   * Returns the assetID of the input.
   */
  getAssetID = ():Buffer => this.assetid;

  // must be implemented to select output types for the VM in question
  abstract fromBuffer(bytes:Buffer, offset?:number):number; 

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTransferableInput]].
   */
  toBuffer():Buffer {
    const inbuff:Buffer = this.input.toBuffer();
    const inputid:Buffer = Buffer.alloc(4);
    inputid.writeInt32BE(this.input.getInputID(), 0);
    const bsize:number = this.txid.length + this.outputidx.length + this.assetid.length + inputid.length + inbuff.length;
    const barr:Array<Buffer> = [this.txid, this.outputidx, this.assetid, inputid, inbuff];
    const buff: Buffer = Buffer.concat(barr, bsize);
    return buff;
  }

  /**
   * Returns a base-58 representation of the [[StandardTransferableInput]].
   */
  toString():string {
    /* istanbul ignore next */
    return bintools.bufferToB58(this.toBuffer());
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  /**
   * Class representing an [[StandardTransferableInput]] for a transaction.
   *
   * @param txid A {@link https://github.com/feross/buffer|Buffer} containing the transaction ID of the referenced UTXO
   * @param outputidx A {@link https://github.com/feross/buffer|Buffer} containing the index of the output in the transaction consumed in the [[StandardTransferableInput]]
   * @param assetID A {@link https://github.com/feross/buffer|Buffer} representing the assetID of the [[Input]]
   * @param input An [[Input]] to be made transferable
   */
  constructor(txid:Buffer = undefined, outputidx:Buffer = undefined, assetID:Buffer = undefined, input:Input = undefined) {
    super();
    if (typeof txid !== 'undefined' && typeof outputidx !== 'undefined' && typeof assetID !== 'undefined' && input instanceof Input) {
      this.input = input;
      this.txid = txid;
      this.outputidx = outputidx;
      this.assetid = assetID;
    }
  }
}

/**
 * An [[Input]] class which specifies a token amount .
 */
export abstract class StandardAmountInput extends Input {
  protected type = "StandardAmountInput";
  protected typeID = undefined;

  protected amount:Buffer = Buffer.alloc(8);
  protected amountValue:BN = new BN(0);

  /**
   * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getAmount = ():BN => this.amountValue.clone();

  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[AmountInput]] and returns the size of the output.
   */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.amount = bintools.copyFrom(bytes, offset, offset + 8);
    this.amountValue = bintools.fromBufferToBN(this.amount);
    offset += 8;
    return super.fromBuffer(bytes, offset);
  }

  /**
   * Returns the buffer representing the [[AmountInput]] instance.
   */
  toBuffer():Buffer {
    const superbuff:Buffer = super.toBuffer();
    const bsize:number = this.amount.length + superbuff.length;
    const barr:Array<Buffer> = [this.amount, superbuff];
    return Buffer.concat(barr, bsize);
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  /**
   * An [[AmountInput]] class which issues a payment on an assetID.
   *
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the input
   */
  constructor(amount:BN = undefined) {
    super();
    if (amount) {
      this.amountValue = amount.clone();
      this.amount = bintools.fromBNToBuffer(amount, 8);
    }
  }
}