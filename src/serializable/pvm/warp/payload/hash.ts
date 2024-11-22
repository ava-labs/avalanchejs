import { pack, unpack } from '../../../../utils/struct';
import type { Codec } from '../../../codec';
import { serializable } from '../../../common/types';
import { TypeSymbols } from '../../../constants';
import { Id } from '../../../fxs/common';

@serializable()
export class Hash {
  _type = TypeSymbols.WarpHash;

  constructor(public readonly hash: Id) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Hash, Uint8Array] {
    const [hash, rest] = unpack(bytes, [Id], codec);

    return [new Hash(hash), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.hash], codec);
  }
}
