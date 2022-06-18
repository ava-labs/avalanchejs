import { serializable } from '../../common/types';
import { packList, unpackList } from '../../utils/serializeList';
import { Signature } from './signature';
/**
 *
 *@see https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-credential
 */

@serializable()
export class Credential {
  id = 'secp256k1fx.Credential';

  constructor(private signatures: Signature[]) {}

  static fromBytes(bytes: Uint8Array): [Credential, Uint8Array] {
    const [sigs, remaining] = unpackList(bytes, Signature);
    return [new Credential(sigs), remaining];
  }

  toBytes(): Uint8Array {
    return packList(this.signatures);
  }
}
