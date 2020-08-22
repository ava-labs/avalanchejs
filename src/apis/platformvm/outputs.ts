/**
 * @packageDocumentation
 * @module API-PlatformVM-Outputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { PlatformVMConstants } from './constants';
import { Output, StandardAmountOutput, StandardTransferableOutput } from '../../common/output';

const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
export const SelectOutputClass = (outputid:number, ...args:Array<any>):Output => {
    if(outputid == PlatformVMConstants.SECPOUTPUTID){
        let secpout:SecpOutput = new SecpOutput( ...args);
        return secpout;
    } 
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
}

export class TransferableOutput extends StandardTransferableOutput{
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.assetID = bintools.copyFrom(bytes, offset, offset + PlatformVMConstants.ASSETIDLEN);
        offset += PlatformVMConstants.ASSETIDLEN;
        const outputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.output = SelectOutputClass(outputid);
        return this.output.fromBuffer(bytes, offset);
      }
}

export abstract class AmountOutput extends StandardAmountOutput {
    /**
     * 
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
export class SecpOutput extends AmountOutput {
  /**
     * Returns the outputID for this output
     */
  getOutputID():number {
    return PlatformVMConstants.SECPOUTPUTID;
  }

  create(...args:any[]):this{
    return new SecpOutput(...args) as this;
  }

  clone():this {
    const newout:SecpOutput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }
}

