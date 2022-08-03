import { packList, unpackList } from '../../../utils/serializeList';
import type { Codec } from '../../codec';
import { serializable } from '../../common/types';
import { Signature } from './signature';

const _symbol = Symbol('secp256k1fx.Credential');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-credential
 */
@serializable()
export class Credential {
  _type = _symbol;

  constructor(private readonly signatures: Signature[]) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Credential, Uint8Array] {
    const [sigs, remaining] = unpackList(bytes, Signature, codec);
    return [new Credential(sigs), remaining];
  }

  setSignature(index: number, signature: Uint8Array) {
    if (index >= this.signatures.length) {
      throw new Error(`index ${index} is out of bounds for credential`);
    }
    this.signatures[index] = new Signature(signature);
  }

  getSignatures() {
    return this.signatures.map((sig) => sig.toString());
  }

  toBytes(codec) {
    return packList(this.signatures, codec);
  }
}
