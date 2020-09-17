/**
 * @packageDocumentation
 * @module API-PlatformVM-Outputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { PlatformVMConstants } from './constants';
import { Output, StandardAmountOutput, StandardTransferableOutput, StandardParseableOutput } from '../../common/output';
import { Serialization, SerializedEncoding } from '../../utils/serialization';

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
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
}

export class TransferableOutput extends StandardTransferableOutput{
  public _typeName = "TransferableOutput";
  public _typeID = undefined;

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
  public _typeName = "ParseableOutput";
  public _typeID = undefined;

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
  public _typeName = "AmountOutput";
  public _typeID = undefined;

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
  public _typeName = "SECPTransferOutput";
  public _typeID = PlatformVMConstants.SECPXFEROUTPUTID;

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
 * An [[Output]] class which only specifies an Output ownership and uses secp256k1 signature scheme.
 */
export class SECPOwnerOutput extends Output {
  public _typeName = "SECPOwnerOutput";
  public _typeID = PlatformVMConstants.SECPOWNEROUTPUTID;

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