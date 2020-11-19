/**
 * @packageDocumentation
 * @module API-EVM-Inputs
 */

import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from '../../utils/bintools';
import { EVMOutput } from './outputs';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the input and returns the proper Input instance.
 *
 * @returns An instance of an [[EVMInput]] class.
 */
export const SelectInputClass = (inputClass: string = 'EVMInput', ...args: any[]): EVMInput => {
  if(inputClass === 'EVMInput') {
    return new EVMInput(...args);
  }
}

export class EVMInput extends EVMOutput {
  protected nonce: Buffer = Buffer.alloc(8);
  protected nonceValue: BN = new BN(0);

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
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  create(...args: any[]): this{
    return new EVMInput(...args) as this;
  }

  clone(): this {
    const newin: EVMInput = this.create();
    newin.fromBuffer(this.toBuffer());
    return newin as this;
  }

  /**
   * An [[EVMInput]] class which contains address, amount, assetID, nonce.
   *
   * @param address The address recieving the asset as a {@link https://github.com/feross/buffer|Buffer} or as a string.
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} or a number representing the locktime.
   * @param assetid The asset id which is being sent as a {@link https://github.com/feross/buffer|Buffer} or as a string.
   * @param nonce A {@link https://github.com/indutny/bn.js/|BN} or a number representing the nonce.
   */
  constructor(
    address: Buffer | string = undefined, 
    amount: BN | number = undefined, 
    assetid: Buffer | string = undefined,
    nonce: BN | number = undefined
  ) {
    super(address, amount, assetid);
    if (typeof address !== 'undefined' && typeof amount !== 'undefined' && typeof assetid !== 'undefined' && typeof nonce !== 'undefined') {

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