import { concatBytes } from '../../utils/buffer';
import type { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import { Int } from '../primitives';
import { unpackCodecList } from '../../utils/serializeList';
import { unpack } from '../../utils/struct';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#initial-state
 */
@serializable()
export class InitialState {
  _type = TypeSymbols.InitialState;

  constructor(
    private readonly fxId: Int,
    private readonly outputs: Serializable[],
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [InitialState, Uint8Array] {
    const [fxId, outputs, rest] = unpack(bytes, [Int, unpackCodecList], codec);
    return [new InitialState(fxId, outputs), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(this.fxId.toBytes(), codec.PackPrefixList(this.outputs));
  }
}
