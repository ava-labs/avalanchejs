import { concatBytes } from '../../utils/buffer';
import { toListStruct } from '../../utils/serializeList';
import { unpack } from '../../utils/struct';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import type { Credential } from '../fxs/secp256k1';

const _symbol = Symbol('avm.SignedTx');

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class SignedTx {
  _type = _symbol;

  constructor(
    public readonly unsignedTx: Serializable,
    public readonly credentials: Serializable[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [SignedTx, Uint8Array] {
    const [unsignedTx, outs, remaining] = unpack(
      bytes,
      [Codec, toListStruct(Codec)],
      codec,
    );
    return [new SignedTx(unsignedTx, outs), remaining];
  }

  getCredentials(): Credential[] {
    return this.credentials as Credential[];
  }

  getAllSignatures() {
    return this.getCredentials().flatMap((cred) => cred.getSignatures());
  }

  toBytes(codec: Codec) {
    return concatBytes(
      codec.PackPrefix(this.unsignedTx),
      codec.PackPrefixList(this.credentials),
    );
  }
}
