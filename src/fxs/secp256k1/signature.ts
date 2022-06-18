import { serializable } from '../../common/types';
import { bufferToHex, hexToBuffer, padLeft } from '../../utils/buffer';

/**
 *
 *@see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-credential
 */

const SepkSignatureLength = 65;
@serializable()
export class Signature {
  id = 'secp256k1fx.Signature';

  constructor(private sig: string) {}

  static fromBytes(bytes: Uint8Array): [Signature, Uint8Array] {
    return [
      new Signature(bufferToHex(bytes.slice(0, SepkSignatureLength))),
      bytes.slice(SepkSignatureLength),
    ];
  }

  toBytes(): Uint8Array {
    return padLeft(hexToBuffer(this.sig), SepkSignatureLength);
  }
}
