import { customInspectSymbol } from '../../../constants/node';
import { bufferToHex, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';

const _symbol = Symbol('secp256k1fx.Signature');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-credential
 */
export const SepkSignatureLength = 65;
@serializable()
export class Signature {
  _type = _symbol;

  constructor(private readonly sig: Uint8Array) {
    if (sig.length !== SepkSignatureLength) {
      throw new Error('incorrect number of bytes for signature');
    }
  }

  static fromBytes(bytes: Uint8Array): [Signature, Uint8Array] {
    return [
      new Signature(bytes.slice(0, SepkSignatureLength)),
      bytes.slice(SepkSignatureLength),
    ];
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toString(), 'string');
  }

  toString() {
    return bufferToHex(this.sig);
  }

  toBytes() {
    return padLeft(this.sig, SepkSignatureLength);
  }
}
