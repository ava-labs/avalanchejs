import { pack, unpack } from '../../../../utils/struct';
import type { Codec } from '../../../codec';
import { serializable } from '../../../common/types';
import { TypeSymbols } from '../../../constants';
import { Bytes } from '../../../primitives';

@serializable()
export class AddressedCall {
  _type = TypeSymbols.WarpAddressedCall;

  constructor(
    public readonly sourceAddress: Bytes,
    public readonly payload: Bytes,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddressedCall, Uint8Array] {
    const [sourceAddress, payload, rest] = unpack(bytes, [Bytes, Bytes], codec);
    return [new AddressedCall(sourceAddress, payload), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.sourceAddress, this.payload], codec);
  }
}
