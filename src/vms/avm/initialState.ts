import { concatBytes } from '@noble/hashes/utils';
import type { Codec } from '../../codec/codec';
import type { Serializable } from '../../common/types';
import { serializable } from '../../common/types';
import { Int } from '../../primatives';
import { unpackCodecList } from '../../utils/serializeList';
import { unpack } from '../../utils/struct';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#initial-state
 */
@serializable()
export class InitialState {
  id = 'avax.InitialState';

  constructor(private fxId: Int, private outputs: Serializable[]) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [InitialState, Uint8Array] {
    const [fxId, outputs, rest] = unpack(bytes, [Int, unpackCodecList], codec);
    return [new InitialState(fxId, outputs), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      this.fxId.toBytes(codec),
      codec.PackPrefixList(this.outputs),
    );
  }
}
