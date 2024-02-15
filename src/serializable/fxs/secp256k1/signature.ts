import { bytesToHex } from '@noble/hashes/utils';
import { hexToBytes } from 'micro-eth-signer';
import { customInspectSymbol } from '../../../constants/node';
import { bufferToHex, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { TypeSymbols } from '../../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-credential
 */
export const SepkSignatureLength = 65;
@serializable()
export class Signature {
  _type = TypeSymbols.Signature;

  constructor(private readonly sig: Uint8Array) {
    if (sig.length !== SepkSignatureLength) {
      throw new Error('incorrect number of bytes for signature');
    }
  }

  toJSON() {
    return bytesToHex(this.sig);
  }

  static fromJSON(jsonStr: string) {
    return new Signature(hexToBytes(jsonStr));
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
