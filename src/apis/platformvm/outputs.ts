/**
 * @packageDocumentation
 * @module API-PlatformVM-Outputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { PlatformVMConstants } from './constants';
import { Output, StandardAmountOutput, StandardTransferableOutput, OutputOwners, StandardParseableOutput } from '../../common/output';

const bintools = BinTools.getInstance();

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
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
}

export class TransferableOutput extends StandardTransferableOutput{
  protected type = "TransferableOutput";
  protected typeID = undefined;

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.assetID = bintools.copyFrom(bytes, offset, offset + PlatformVMConstants.ASSETIDLEN);
    offset += PlatformVMConstants.ASSETIDLEN;
    const outputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.output = SelectOutputClass(outputid);
    return this.output.fromBuffer(bytes, offset);
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  deserialize(obj:object, encoding:string = "hex"):this {

  };

  serialize(encoding:string = "hex"):string {

  };
}

export class ParseableOutput extends StandardParseableOutput{
  protected type = "ParseableOutput";
  protected typeID = undefined;

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    const outputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.output = SelectOutputClass(outputid);
    return this.output.fromBuffer(bytes, offset);
  }
  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  deserialize(obj:object, encoding:string = "hex"):this {

  };

  serialize(encoding:string = "hex"):string {

  };
}

export abstract class AmountOutput extends StandardAmountOutput {
  protected type = "AmountOutput";
  protected typeID = undefined;

  /**
   * 
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID:Buffer):TransferableOutput {
    return new TransferableOutput(assetID, this);
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  select(id:number, ...args: any[]):Output {
    return SelectOutputClass(id, ...args);
  }
}

/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
export class SECPTransferOutput extends AmountOutput {
  protected type = "SECPTransferOutput";
  protected typeID = PlatformVMConstants.SECPXFEROUTPUTID;

  /**
     * Returns the outputID for this output
     */
  getOutputID():number {
    return this.typeID;
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  deserialize(obj:object, encoding:string = "hex"):this {

  };

  serialize(encoding:string = "hex"):string {

  };

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
 * An [[Output]] class which only specifies an Output ownership and uses secp256k1 signature scheme.
 */
export class SECPOwnerOutput extends Output {
  protected type = "SECPOwnerOutput";
  protected typeID = PlatformVMConstants.SECPOWNEROUTPUTID;

  /**
     * Returns the outputID for this output
     */
  getOutputID():number {
    return this.typeID;
  }

  /**
   * 
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID:Buffer):TransferableOutput {
    return new TransferableOutput(assetID, this);
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  deserialize(obj:object, encoding:string = "hex"):this {

  };

  serialize(encoding:string = "hex"):string {

  };

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