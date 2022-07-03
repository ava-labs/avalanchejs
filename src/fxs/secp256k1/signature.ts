import { serializable } from '../../common/types';
import { bufferToHex, hexToBuffer, padLeft } from '../../utils/buffer';

const _symbol = Symbol('secp256k1fx.Signature');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-credential
 */
const SepkSignatureLength = 65;
@serializable()
export class Signature {
  _type = _symbol;

  constructor(private readonly sig: string) {}

  static fromBytes(bytes: Uint8Array): [Signature, Uint8Array] {
    return [
      new Signature(bufferToHex(bytes.slice(0, SepkSignatureLength))),
      bytes.slice(SepkSignatureLength),
    ];
  }

  toBytes() {
    return padLeft(hexToBuffer(this.sig), SepkSignatureLength);
  }
}
