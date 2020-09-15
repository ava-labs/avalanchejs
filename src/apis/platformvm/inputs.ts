/**
 * @packageDocumentation
 * @module API-PlatformVM-Inputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { PlatformVMConstants } from './constants';
import { Input, StandardTransferableInput, StandardAmountInput } from '../../common/input';


/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
export const SelectInputClass = (inputid:number, ...args:Array<any>):Input => {
  if (inputid === PlatformVMConstants.SECPINPUTID) {
    const secpin:SECPTransferInput = new SECPTransferInput(...args);
    return secpin;
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectInputClass: unknown inputid ${inputid}`);
};

export class TransferableInput extends StandardTransferableInput {
  protected type = "TransferableInput";
  protected typeID = undefined;

  getFields(encoding:SerializedEncoding = "hex"):object {};
  setFields(fields:object, encoding:SerializedEncoding = "hex") {

  }

  deserialize(obj:object, encoding:SerializedEncoding = "hex"):this {

  };

  serialize(encoding:SerializedEncoding = "hex"):string {

  };

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
    this.assetid = bintools.copyFrom(bytes, offset, offset + PlatformVMConstants.ASSETIDLEN);
    offset += 32;
    const inputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.input = SelectInputClass(inputid);
    return this.input.fromBuffer(bytes, offset);
  }

}

export abstract class AmountInput extends StandardAmountInput {
  protected type = "AmountInput";
  protected typeID = undefined;

  getFields(encoding:SerializedEncoding = "hex"):object {};
  setFields(fields:object, encoding:SerializedEncoding = "hex") {

  }

  select(id:number, ...args: any[]):Input {
    return SelectInputClass(id, ...args);
  }
}

export class SECPTransferInput extends AmountInput {
  protected type = "SECPTransferInput";
  protected typeID = PlatformVMConstants.SECPINPUTID;

  getFields(encoding:SerializedEncoding = "hex"):object {};
  setFields(fields:object, encoding:SerializedEncoding = "hex") {

  }

  deserialize(obj:object, encoding:SerializedEncoding = "hex"):this {

  };

  serialize(encoding:SerializedEncoding = "hex"):string {

  };

  /**
     * Returns the inputID for this input
     */
  getInputID():number {
    return this.typeID;
  }

  getCredentialID = ():number => PlatformVMConstants.SECPCREDENTIAL;

  create(...args:any[]):this{
    return new SECPTransferInput(...args) as this;
  }

  clone():this {
    const newout:SECPTransferInput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }
}
