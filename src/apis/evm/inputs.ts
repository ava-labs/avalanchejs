/**
 * @packageDocumentation
 * @module API-EVM-Inputs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { EVMConstants } from './constants';
import { 
  Input, 
  StandardTransferableInput, 
  StandardAmountInput 
} from '../../common/input';
import { SerializedEncoding } from '../../utils/serialization';
import { EVMOutput } from './outputs';
import BN from 'bn.js';
import { SigIdx } from '../../common/credentials';

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[Input]] instance.
 *
 * @param inputID A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Input]]-extended class.
 */
export const SelectInputClass = (inputID: number, ...args: any[]): Input => {
  if (inputID === EVMConstants.SECPINPUTID) {
    return new SECPTransferInput(...args);
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectInputClass: unknown inputID ${inputID}`);
};

export class TransferableInput extends StandardTransferableInput {
  protected _typeName = "TransferableInput";
  protected _typeID = undefined;

  //serialize is inherited

  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
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
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.txid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.assetid = bintools.copyFrom(bytes, offset, offset + EVMConstants.ASSETIDLEN);
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

  select(id: number, ...args: any[]): Input {
    return SelectInputClass(id, ...args);
  }
}

export class SECPTransferInput extends AmountInput {
  protected _typeName = "SECPTransferInput";
  protected _typeID = EVMConstants.SECPINPUTID;

  //serialize and deserialize both are inherited

  /**
     * Returns the inputID for this input
     */
  getInputID(): number {
    return EVMConstants.SECPINPUTID;
  }

  getCredentialID = (): number => EVMConstants.SECPCREDENTIAL;

  create(...args: any[]): this{
    return new SECPTransferInput(...args) as this;
  }

  clone(): this {
    const newout: SECPTransferInput = this.create()
    newout.fromBuffer(this.toBuffer());
    return newout as this;
  }
}

export class EVMInput extends EVMOutput {
  protected nonce: Buffer = Buffer.alloc(8);
  protected nonceValue: BN = new BN(0);
  protected sigCount: Buffer = Buffer.alloc(4);
  protected sigIdxs: SigIdx[] = []; // idxs of signers from utxo

  /**
   * Returns the array of [[SigIdx]] for this [[Input]]
   */
  getSigIdxs = (): SigIdx[] => this.sigIdxs;

  /**
   * Creates and adds a [[SigIdx]] to the [[Input]].
   *
   * @param addressIdx The index of the address to reference in the signatures
   * @param address The address of the source of the signature
   */
  addSignatureIdx = (addressIdx: number, address: Buffer) => {
    const sigidx: SigIdx = new SigIdx();
    const b: Buffer = Buffer.alloc(4);
    b.writeUInt32BE(addressIdx, 0);
    sigidx.fromBuffer(b);
    sigidx.setSource(address);
    this.sigIdxs.push(sigidx);
    this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
  };


  /**
   * Returns the nonce as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getNonce = (): BN => this.nonceValue.clone();
 
  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[EVMOutput]].
   */
  toBuffer(): Buffer {
    let superbuff: Buffer = super.toBuffer();
    let bsize: number = superbuff.length + this.nonce.length;
    let barr: Buffer[] = [superbuff, this.nonce];
    return Buffer.concat(barr,bsize);
  }

  getCredentialID = (): number => EVMConstants.SECPCREDENTIAL;

  /**
   * Decodes the [[EVMInput]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
   *
   * @param bytes The bytes as a {@link https://github.com/feross/buffer|Buffer}.
   * @param offset An offset as a number.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset);
    this.nonce = bintools.copyFrom(bytes, offset, offset + 8);
    offset += 8;
    return offset;
  }

  /**
   * Returns a base-58 representation of the [[EVMInput]].
   */
  toString(): string {
    return bintools.bufferToB58(this.toBuffer());
  }

  create(...args: any[]): this{
    return new EVMInput(...args) as this;
  }

  clone(): this {
    const newEVMInput: EVMInput = this.create();
    newEVMInput.fromBuffer(this.toBuffer());
    return newEVMInput as this;
  }

  /**
   * An [[EVMInput]] class which contains address, amount, assetID, nonce.
   *
   * @param address is the EVM address from which to transfer funds.
   * @param amount is the amount of the asset to be transferred (specified in nAVAX for AVAX and the smallest denomination for all other assets).
   * @param assetID The assetID which is being sent as a {@link https://github.com/feross/buffer|Buffer} or as a string.
   * @param nonce A {@link https://github.com/indutny/bn.js/|BN} or a number representing the nonce.
   */
  constructor(
    address: Buffer | string = undefined, 
    amount: BN | number = undefined, 
    assetID: Buffer | string = undefined,
    nonce: BN | number = undefined
  ) {
    super(address, amount, assetID);

    if (typeof nonce !== 'undefined') {
      // convert number nonce to BN
      let n:BN;
      if (typeof nonce === 'number') {
        n = new BN(nonce);
      } else {
        n = nonce;
      }

      this.nonceValue = n.clone();
      this.nonce = bintools.fromBNToBuffer(n, 8);
    }
  }
}  
