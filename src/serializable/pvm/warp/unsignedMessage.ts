import { pack, unpack } from '../../../utils/struct';
import type { Codec } from '../../codec';
import { serializable } from '../../common/types';
import { TypeSymbols } from '../../constants';
import { Id } from '../../fxs/common';
import { Bytes, Int } from '../../primitives';

@serializable()
export class WarpUnsignedMessage {
  _type = TypeSymbols.WarpUnsignedMessage;

  constructor(
    public readonly networkId: Int,
    public readonly sourceChainId: Id,
    public readonly payload: Bytes,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [WarpUnsignedMessage, Uint8Array] {
    const [networkId, sourceChainId, payload, rest] = unpack(
      bytes,
      [Int, Id, Bytes],
      codec,
    );

    return [new WarpUnsignedMessage(networkId, sourceChainId, payload), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.networkId, this.sourceChainId, this.payload], codec);
  }
}
