/**
 * @packageDocumentation
 * @module API-AVM-Outputs
 */
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from '../../utils/bintools';
import { AVMConstants } from './constants';
import { Output, StandardAmountOutput, StandardTransferableOutput, BaseNFTOutput } from '../../common/output';

const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
export const SelectOutputClass = (outputid:number, ...args:Array<any>):Output => {
    if(outputid == AVMConstants.SECPOUTPUTID){
        let secpout:SecpOutput = new SecpOutput( ...args);
        return secpout;
    } else if(outputid == AVMConstants.NFTMINTOUTPUTID){
        let nftout:NFTMintOutput = new NFTMintOutput(...args);
        return nftout;
    } else if(outputid == AVMConstants.NFTXFEROUTPUTID){
        let nftout:NFTTransferOutput = new NFTTransferOutput(...args);
        return nftout;
    }
    throw new Error("Error - SelectOutputClass: unknown outputid " + outputid);
}

export class TransferableOutput extends StandardTransferableOutput{
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.assetID = bintools.copyFrom(bytes, offset, offset + AVMConstants.ASSETIDLEN);
        offset += AVMConstants.ASSETIDLEN;
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

export abstract class NFTOutput extends BaseNFTOutput {
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
    return AVMConstants.SECPOUTPUTID;
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

/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
export class SecpMintOutput extends Output {

  /**
   * Returns the outputID for this output
   */
  getOutputID():number {
    return AVMConstants.SECPMINTOUTPUTID;
  }

  /**
   * 
   * @param assetID An assetID which is wrapped around the Buffer of the Output
   */
  makeTransferable(assetID:Buffer):TransferableOutput {
    return new TransferableOutput(assetID, this);
  }

  create(...args:any[]):this{
    return new SecpMintOutput(...args) as this;
  }

  clone():this {
    const newout:SecpMintOutput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }

  select(id:number, ...args: any[]):Output {
    return SelectOutputClass(id, ...args);
  }

}

/**
 * An [[Output]] class which specifies an Output that carries an NFT Mint and uses secp256k1 signature scheme.
 */
export class NFTMintOutput extends NFTOutput {
    /**
     * Returns the outputID for this output
     */
    getOutputID():number {
        return AVMConstants.NFTMINTOUTPUTID;
    }

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff:Buffer, offset:number = 0):number {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        return super.fromBuffer(utxobuff, offset);
    }

    /**
     * Returns the buffer representing the [[NFTMintOutput]] instance.
     */
    toBuffer():Buffer {
        let superbuff:Buffer = super.toBuffer();
        let bsize:number = this.groupID.length + superbuff.length;
        let barr:Array<Buffer> = [this.groupID, superbuff];
        return Buffer.concat(barr,bsize);
    }

    create(...args:any[]):this{
        return new NFTMintOutput(...args) as this;
    }

    clone():this {
        const newout:NFTMintOutput = this.create()
        newout.fromBuffer(this.toBuffer());
        return newout as this;
    }

    /**
     * An [[Output]] class which contains an NFT mint for an assetID.
     * 
     * @param groupID A number specifies the group this NFT is issued to
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     */
    constructor(groupID:number = undefined, addresses:Array<Buffer> = undefined, locktime:BN = undefined, threshold:number = undefined){
        super(addresses, locktime, threshold);
        if(typeof groupID !== 'undefined') {
            this.groupID.writeUInt32BE(groupID, 0);
        }
    }
}

/**
 * An [[Output]] class which specifies an Output that carries an NFT and uses secp256k1 signature scheme.
 */
export class NFTTransferOutput extends NFTOutput {
    protected sizePayload:Buffer = Buffer.alloc(4);
    protected payload:Buffer;

    /**
     * Returns the outputID for this output
     */
    getOutputID():number {
        return AVMConstants.NFTXFEROUTPUTID;
    }

  /**
     * Returns the payload as a {@link https://github.com/feross/buffer|Buffer}
     */
  getPayload = ():Buffer => bintools.copyFrom(this.payload);

    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff:Buffer, offset:number = 0):number {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.sizePayload = bintools.copyFrom(utxobuff, offset, offset + 4);
        let psize:number = this.sizePayload.readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(utxobuff, offset, offset + psize);
        offset = offset + psize;
        return super.fromBuffer(utxobuff, offset);
    }

    /**
     * Returns the buffer representing the [[NFTTransferOutput]] instance.
     */
  toBuffer():Buffer {
    const superbuff:Buffer = super.toBuffer();
    const bsize:number = this.groupID.length + this.sizePayload.length + this.payload.length + superbuff.length;
    this.sizePayload.writeUInt32BE(this.payload.length, 0);
    const barr:Array<Buffer> = [this.groupID, this.sizePayload, this.payload, superbuff];
    return Buffer.concat(barr, bsize);
  }

  create(...args:any[]):this{
    return new NFTTransferOutput(...args) as this;
  }

  clone():this {
    const newout:NFTTransferOutput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }

  /**
     * An [[Output]] class which contains an NFT on an assetID.
     *
     * @param groupID A number representing the amount in the output
     * @param payload A {@link https://github.com/feross/buffer|Buffer} of max length 1024 
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction

     */
  constructor(groupID:number = undefined, payload:Buffer = undefined, addresses:Array<Buffer> = undefined, locktime:BN = undefined, threshold:number = undefined, ) {
    super(addresses, locktime, threshold);
    if (typeof groupID !== 'undefined' && typeof payload !== 'undefined') {
      this.groupID.writeUInt32BE(groupID, 0);
      this.sizePayload.writeUInt32BE(payload.length, 0);
      this.payload = bintools.copyFrom(payload, 0, payload.length);
    }
  }
}
