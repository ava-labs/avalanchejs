import { bufferToHex, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';

const _symbol = Symbol('secp256k1fx.Signature');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-credential
 */
const SepkSignatureLength = 65;
@serializable()
export class Signature {
  _type = _symbol;

  constructor(private readonly sig: Uint8Array) {}

  static fromBytes(bytes: Uint8Array): [Signature, Uint8Array] {
    return [
      new Signature(bytes.slice(0, SepkSignatureLength)),
      bytes.slice(SepkSignatureLength),
    ];
  }

  toString() {
    return bufferToHex(this.sig);
  }

  toBytes() {
    return padLeft(this.sig, SepkSignatureLength);
  }
}
