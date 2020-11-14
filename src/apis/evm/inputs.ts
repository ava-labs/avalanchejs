import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from '../../utils/bintools';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

export class EVMInput {
  protected address: Buffer = Buffer.alloc(20); 
  protected amount: Buffer = Buffer.alloc(8);
  protected amountValue: BN = new BN(0);
  protected assetid: Buffer = Buffer.alloc(32);
  protected nonce: Buffer = Buffer.alloc(8);
  protected nonceValue: BN = new BN(0);

  /**
   * Returns the assetID of the input as {@link https://github.com/feross/buffer|Buffer}
   */
  getAddress = (): Buffer => this.address;

  /**
   * Returns the amount as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getAmount = (): BN => this.amountValue.clone();

  /**
   * Returns the assetID of the input as {@link https://github.com/feross/buffer|Buffer}
   */ 
  getAssetID = (): Buffer => this.assetid;

  /**
   * Returns the nonce as a {@link https://github.com/indutny/bn.js/|BN}.
   */
  getNonce = (): BN => this.nonceValue.clone();
 
  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[EVMOutput]].
   */
  toBuffer():Buffer {
    const bsize: number = this.address.length + this.amount.length + this.assetid.length + this.nonce.length;
    const barr: Buffer[] = [this.address, this.amount, this.assetid, this.nonce];
    const buff: Buffer = Buffer.concat(barr, bsize);
    return buff;
  }

  /**
   * Decodes the [[EVMInput]] as a {@link https://github.com/feross/buffer|Buffer} and returns the size.
   */
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.address = bintools.copyFrom(bytes, offset, offset + 20);
    offset += 20;
    this.amount = bintools.copyFrom(bytes, offset, offset + 8);
    offset += 8;
    this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.nonce = bintools.copyFrom(bytes, offset, offset + 8);
    offset += 8;
    return offset;
  }

  /**
   * Returns a base-58 representation of the [[Input]].
   */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  /**
   * An [[EVMInput]] class which contains address, amount, and assetID.
   *
   * @param address The address recieving the asset as a {@link https://github.com/feross/buffer|Buffer}
   * @param amount A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
   * @param assetid The asset id which is being sent as a {@link https://github.com/feross/buffer|Buffer}
   * @param nonce A {@link https://github.com/indutny/bn.js/|BN} representing the nonce 
   */
  constructor(address: Buffer = undefined, amount: BN = undefined, assetid: Buffer = undefined, nonce: BN = undefined) {
    if (typeof address !== 'undefined' && typeof amount !== 'undefined' && typeof assetid !== 'undefined' && typeof nonce !== 'undefined') {
      this.address = address;
      this.amountValue = amount.clone();
      this.amount = bintools.fromBNToBuffer(amount, 8);
      this.assetid = assetid;
      this.nonceValue = nonce.clone();
      this.nonce = bintools.fromBNToBuffer(nonce, 8);
    }
  }
}  