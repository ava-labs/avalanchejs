/**
 * @packageDocumentation
 * @module API-AVM-Inputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { AVMConstants } from './constants';
import { Input, StandardTransferableInput, StandardAmountInput } from '../../common/input';
import { Serialization, SerializedEncoding } from '../../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
export const SelectInputClass = (inputid:number, ...args:Array<any>):Input => {
  if (inputid === AVMConstants.SECPINPUTID) {
    return new SECPTransferInput(...args);
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectInputClass: unknown inputid ${inputid}`);
};

export class TransferableInput extends StandardTransferableInput {
  protected _typeName = "TransferableInput";
  protected _typeID = undefined;

  //serialize is inherited

  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.input = SelectInputClass(fields["input"]["_typeID"]);
    this.input.deserialize(fields["input"], encoding);
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing a [[TransferableInput]], parses it, populates the class, and returns the length of the [[TransferableInput]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[TransferableInput]]
   *
   * @returns The length of the raw [[TransferableInput]]
   */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.txid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.assetid = bintools.copyFrom(bytes, offset, offset + AVMConstants.ASSETIDLEN);
    offset += 32;
    const inputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.input = SelectInputClass(inputid);
    return this.input.fromBuffer(bytes, offset);
  }
  
}

export abstract class AmountInput extends StandardAmountInput {
  protected _typeName = "AmountInput";
  protected _typeID = undefined;

  //serialize and deserialize both are inherited

  select(id:number, ...args: any[]):Input {
    return SelectInputClass(id, ...args);
  }
}

export class SECPTransferInput extends AmountInput {
  protected _typeName = "SECPTransferInput";
  protected _typeID = AVMConstants.SECPINPUTID;

  //serialize and deserialize both are inherited

  /**
     * Returns the inputID for this input
     */
  getInputID():number {
    return AVMConstants.SECPINPUTID;
  }

  getCredentialID = ():number => AVMConstants.SECPCREDENTIAL;

  create(...args:any[]):this{
    return new SECPTransferInput(...args) as this;
  }

  clone():this {
    const newout:SECPTransferInput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }
}
