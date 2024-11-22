import { pack, unpack } from '../../../utils/struct';
import type { Codec } from '../../codec';
import { serializable } from '../../common/types';
import { TypeSymbols } from '../../constants';
import { Id } from '../../fxs/common';
import { Int } from '../../primitives';
import { concatBytes } from '../../../utils/buffer';

@serializable()
export class WarpUnsignedMessage {
  _type = TypeSymbols.WarpUnsignedMessage;

  constructor(
    public readonly networkId: Int,
    public readonly sourceChainId: Id,
    public readonly payload: Uint8Array,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [WarpUnsignedMessage, Uint8Array] {
    const [networkId, sourceChainId, payload] = unpack(bytes, [Int, Id], codec);

    return [
      new WarpUnsignedMessage(networkId, sourceChainId, payload),
      new Uint8Array([]),
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.networkId, this.sourceChainId], codec),
      this.payload,
    );
  }
}
