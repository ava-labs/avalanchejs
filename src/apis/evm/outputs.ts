/**
 * @packageDocumentation
 * @module API-EVM-Outputs
 */
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from '../../utils/bintools';
import { EVMConstants } from './constants';
import { Output, StandardAmountOutput, StandardTransferableOutput, BaseNFTOutput } from '../../common/output';
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
    if(outputid == EVMConstants.SECPXFEROUTPUTID){
        return new SECPTransferOutput( ...args);
    } else if(outputid == EVMConstants.SECPMINTOUTPUTID){
        return new SECPMintOutput( ...args);
    } else if(outputid == EVMConstants.NFTMINTOUTPUTID){
        return new NFTMintOutput(...args);
    } else if(outputid == EVMConstants.NFTXFEROUTPUTID){
        return new NFTTransferOutput(...args);
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
    this.assetID = bintools.copyFrom(bytes, offset, offset + EVMConstants.ASSETIDLEN);
    offset += EVMConstants.ASSETIDLEN;
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
  protected _typeName = "NFTOutput";
  protected _typeID = undefined;

  //serialize and deserialize both are inherited

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
export class SECPTransferOutput extends AmountOutput {
  protected _typeName = "SECPTransferOutput";
  protected _typeID = EVMConstants.SECPXFEROUTPUTID;

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
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
export class SECPMintOutput extends Output {
  protected _typeName = "SECPMintOutput";
  protected _typeID = EVMConstants.SECPMINTOUTPUTID;

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
    return new SECPMintOutput(...args) as this;
  }

  clone():this {
    const newout:SECPMintOutput = this.create()
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
  protected _typeName = "NFTMintOutput";
  protected _typeID = EVMConstants.NFTMINTOUTPUTID;

  //serialize and deserialize both are inherited

  /**
   * Returns the outputID for this output
   */
  getOutputID():number {
      return this._typeID;
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
      const newout:NFTMintOutput = this.create();
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
  protected _typeName = "NFTTransferOutput";
  protected _typeID = EVMConstants.NFTXFEROUTPUTID;

  serialize(encoding:SerializedEncoding = "hex"):object {
    let fields:object = super.serialize(encoding);
    return {
      ...fields,
      "payload": serializer.encoder(this.payload, encoding, "Buffer", "hex", this.payload.length)
    }
  };
  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.payload = serializer.decoder(fields["payload"], encoding, "hex", "Buffer");
    this.sizePayload = Buffer.alloc(4);
    this.sizePayload.writeUInt32BE(this.payload.length, 0);
  }

  protected sizePayload:Buffer = Buffer.alloc(4);
  protected payload:Buffer;

  /**
   * Returns the outputID for this output
   */
  getOutputID():number {
      return this._typeID;
  }

  /**
   * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with content only.
   */
  getPayload = ():Buffer =>  bintools.copyFrom(this.payload);


  /**
   * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with length of payload prepended.
   */
  getPayloadBuffer = ():Buffer => Buffer.concat([bintools.copyFrom(this.sizePayload), bintools.copyFrom(this.payload)]);


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

export class EVMOutput {
  protected address: Buffer = Buffer.alloc(20); 
  protected amount: Buffer = Buffer.alloc(8);
  protected amountValue: BN = new BN(0);
  protected assetid: Buffer = Buffer.alloc(32);

  /**
   * Returns the address of the input as {@link https://github.com/feross/buffer|Buffer}
   */
  getAddress = (): Buffer => this.address;

  /**
   * Returns the address as a bech32 encoded string.
   */
  // TODO - Get getAddressString to work. Why is `getPreferredHRP(networkID)` failing?
  // getAddressString = (networkID: number = 1, blockchainID: string = "X"): string => {return bintools.addressToString(getPreferredHRP(networkID), blockchainID, this.address)}

  /**
   * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getAmount = (): BN => this.amountValue.clone();

  /**
   * Returns the assetid of the input as {@link https://github.com/feross/buffer|Buffer}
   */ 
  getAssetID = (): Buffer => this.assetid;
 
  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[EVMOutput]].
   */
  toBuffer():Buffer {
    const bsize: number = this.address.length + this.amount.length + this.assetid.length;
    const barr: Buffer[] = [this.address, this.amount, this.assetid];
    const buff: Buffer = Buffer.concat(barr, bsize);
    return buff;
  }

  /**
   * Decodes the [[EVMOutput]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.address = bintools.copyFrom(bytes, offset, offset + 20);
    offset += 20;
    this.amount = bintools.copyFrom(bytes, offset, offset + 8);
    offset += 8;
    this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    return offset;
  }

  /**
   * Returns a base-58 representation of the [[EVMOutput]].
   */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  create(...args: any[]): this{
    return new EVMOutput(...args) as this;
  }

  clone(): this {
    const newout: EVMOutput = this.create();
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }

  /**
   * An [[EVMOutput]] class which contains address, amount, and assetID.
   *
   * @param address The address recieving the asset as a {@link https://github.com/feross/buffer|Buffer} or a string.
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} or number representing the amount.
   * @param assetid The asset id which is being sent as a {@link https://github.com/feross/buffer|Buffer} or a string.
   */
  constructor(
    address: Buffer | string = undefined, 
    amount: BN | number = undefined, 
    assetid: Buffer | string = undefined
  ) {
    if (typeof address !== 'undefined' && typeof amount !== 'undefined' && typeof assetid !== 'undefined') {
      // convert string address to Buffer
      if(!(address instanceof Buffer)) {
        address = bintools.stringToAddress(address);
      }

      // convert number amount to BN
      let amnt:BN;
      if (typeof amount === 'number') {
        amnt = new BN(amount);
      } else {
        amnt = amount;
      }

      // convert string assetid to Buffer
      if(!(assetid instanceof Buffer)) {
        assetid = bintools.cb58Decode(assetid);
      }

      this.address = address;
      this.amountValue = amnt.clone();
      this.amount = bintools.fromBNToBuffer(amnt, 8);
      this.assetid = assetid;
    }
  }
}  