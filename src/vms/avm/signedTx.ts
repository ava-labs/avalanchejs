import { concatBytes } from '@noble/hashes/utils';
import { Codec } from '../../codec/codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { convertListStruct } from '../../utils/serializeList';
import { unpack } from '../../utils/struct';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class SignedTx {
  id = 'avax.SignedTx';

  constructor(
    private unsignedTx: Serializable,
    private credentials: Serializable[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [SignedTx, Uint8Array] {
    const [unsignedTx, outs, remaining] = unpack(
      bytes,
      [Codec, convertListStruct(Codec)],
      codec,
    );
    return [new SignedTx(unsignedTx, outs), remaining];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      codec.PackPrefix(this.unsignedTx),
      codec.PackPrefixList(this.credentials),
    );
  }
}
