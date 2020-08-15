/**
 * @packageDocumentation
 * @module AVMAPI-Inputs
 */
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from '../../utils/bintools';
import { AVMConstants } from './constants';
import { Input, StandardTransferableInput, BaseAmountInput } from '../../common/input';

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
  if (inputid === AVMConstants.SECPINPUTID) {
    const secpin:SecpInput = new SecpInput(...args);
    return secpin;
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectInputClass: unknown inputid ${inputid}`);
};

export class TransferableInput extends StandardTransferableInput {
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

export class SecpInput extends BaseAmountInput {
  /**
     * Returns the inputID for this input
     */
  getInputID():number {
    return AVMConstants.SECPINPUTID;
  }
}
