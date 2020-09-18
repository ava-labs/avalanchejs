/**
 * @packageDocumentation
 * @module API-PlatformVM-Outputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { PlatformVMConstants } from './constants';
import { Output, StandardAmountOutput, StandardTransferableOutput, StandardParseableOutput } from '../../common/output';
import { Serialization, SerializedEncoding } from '../../utils/serialization';
import BN from 'bn.js';

const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
export const SelectOutputClass = (outputid:number, ...args:Array<any>):Output => {
    if(outputid == PlatformVMConstants.SECPXFEROUTPUTID){
      return new SECPTransferOutput( ...args);
    } else if(outputid == PlatformVMConstants.SECPOWNEROUTPUTID) {
      return new SECPOwnerOutput(...args);
    } else if(outputid == PlatformVMConstants.STAKEABLELOCKOUTID) {
      return new StakeableLockOut(...args);
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
}

export class TransferableOutput extends StandardTransferableOutput{
  protected _typeName = "TransferableOutput";
  protected _typeID = undefined;

  //serialize is inherited

  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.output = SelectOutputClass(fields["output"]["_typeID"]);
    this.output.deserialize(fields["output"], encoding);
  }

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.assetID = bintools.copyFrom(bytes, offset, offset + PlatformVMConstants.ASSETIDLEN);
    offset += PlatformVMConstants.ASSETIDLEN;
    const outputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.output = SelectOutputClass(outputid);
    return this.output.fromBuffer(bytes, offset);
  }

}

export class ParseableOutput extends StandardParseableOutput{
  protected _typeName = "ParseableOutput";
  protected _typeID = undefined;

  //serialize is inherited

  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.output = SelectOutputClass(fields["output"]["_typeID"]);
    this.output.deserialize(fields["output"], encoding);
  }

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    const outputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.output = SelectOutputClass(outputid);
    return this.output.fromBuffer(bytes, offset);
  }
}

export abstract class AmountOutput extends StandardAmountOutput {
  protected _typeName = "AmountOutput";
  protected _typeID = undefined;

  //serialize and deserialize both are inherited

  /**
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID:Buffer):TransferableOutput {
    return new TransferableOutput(assetID, this);
  }

  select(id:number, ...args: any[]):Output {
    return SelectOutputClass(id, ...args);
  }
}

/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
export class SECPTransferOutput extends AmountOutput {
  protected _typeName = "SECPTransferOutput";
  protected _typeID = PlatformVMConstants.SECPXFEROUTPUTID;

  //serialize and deserialize both are inherited

  /**
   * Returns the outputID for this output
   */
  getOutputID():number {
    return this._typeID;
  }

  create(...args:any[]):this{
    return new SECPTransferOutput(...args) as this;
  }

  clone():this {
    const newout:SECPTransferOutput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }
}

/**
 * An [[Output]] class which specifies an input that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
 */
export class StakeableLockOut extends SECPTransferOutput {
  protected _typeName = "StakeableLockOut";
  protected _typeID = PlatformVMConstants.STAKEABLELOCKOUTID;

  //serialize and deserialize both are inherited

  serialize(encoding:SerializedEncoding = "hex"):object {
    let fields:object = super.serialize(encoding);
    return {
      ...fields,
      "stakeableLocktime": serializer.encoder(this.stakeableLocktime, encoding, "Buffer", "decimalString", 8)
    }
  };
  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.stakeableLocktime = serializer.decoder(fields["stakeableLocktime"], encoding, "decimalString", "Buffer", 8);
  }

  protected stakeableLocktime:Buffer;
  /**
   * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[StakeableLockOut]] and returns the size of the output.
   */
  fromBuffer(outbuff:Buffer, offset:number = 0):number {
    this.stakeableLocktime = bintools.copyFrom(outbuff, offset, offset + 8);
    offset += 8;
    return super.fromBuffer(outbuff, offset);
  }

  /**
   * Returns the buffer representing the [[StakeableLockOut]] instance.
   */
  toBuffer():Buffer {
    const superbuff:Buffer = super.toBuffer();
    const bsize:number = this.stakeableLocktime.length + superbuff.length;
    const barr:Array<Buffer> = [this.stakeableLocktime, superbuff];
    return Buffer.concat(barr, bsize);
  }

  /**
   * Returns the outputID for this output
   */
  getOutputID():number {
    return this._typeID;
  }

  create(...args:any[]):this{
    return new SECPTransferOutput(...args) as this;
  }

  clone():this {
    const newout:SECPTransferOutput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }

  /**
   * A [[StandardAmountOutput]] class which specifies an [[Output]] that has a locktime which can also enable staking of the value held, preventing transfers but not validation.
   *
   * @param stakeableLocktime A {@link https://github.com/indutny/bn.js/|BN} representing the stakeable locktime
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the amount in the output
   * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
   * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param threshold A number representing the the threshold number of signers required to sign the transaction
   */
  constructor(stakeableLocktime:BN = undefined, amount:BN = undefined, addresses:Array<Buffer> = undefined, locktime:BN = undefined, threshold:number = undefined) {
    super(amount, addresses, locktime, threshold);
    if (typeof stakeableLocktime !== undefined) {
      this.stakeableLocktime = bintools.fromBNToBuffer(stakeableLocktime, 8);
    }
  }
}


/**
 * An [[Output]] class which only specifies an Output ownership and uses secp256k1 signature scheme.
 */
export class SECPOwnerOutput extends Output {
  protected _typeName = "SECPOwnerOutput";
  protected _typeID = PlatformVMConstants.SECPOWNEROUTPUTID;

  //serialize and deserialize both are inherited

  /**
   * Returns the outputID for this output
   */
  getOutputID():number {
    return this._typeID;
  }

  /**
   * 
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID:Buffer):TransferableOutput {
    return new TransferableOutput(assetID, this);
  }

  create(...args:any[]):this{
    return new SECPOwnerOutput(...args) as this;
  }

  clone():this {
    const newout:SECPOwnerOutput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }

  select(id:number, ...args: any[]):Output {
    return SelectOutputClass(id, ...args);
  }
}