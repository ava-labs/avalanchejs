import { pack, unpack } from '../../../../utils/struct';
import type { Codec } from '../../../codec';
import { serializable } from '../../../common/types';
import { TypeSymbols } from '../../../constants';
import { Address } from '../../../fxs/common';
import { Bytes, Int, Short } from '../../../primitives';

@serializable()
export class AddressedCall {
  _type = TypeSymbols.AddressedCall;
  public readonly codecId = new Short(0);
  public readonly typeId = new Int(1);

  constructor(
    public readonly sourceAddress: Address,
    public readonly payload: Bytes,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AddressedCall, Uint8Array] {
    const [typeId, remaining] = unpack(bytes, [Int], codec);
    if (typeId.value() !== 1) {
      throw new Error(
        `Invalid type id for AddressedCall. Required typeId: 1. Got typeId: ${typeId.value()}`,
      );
    }

    const [sourceAddressBytes, payload, rest] = unpack(
      remaining,
      [Bytes, Bytes],
      codec,
    );
    const sourceAddress = new Address(sourceAddressBytes.bytes);

    return [new AddressedCall(sourceAddress, payload), rest];
  }

  toBytes(codec: Codec) {
    const sourceAddressBytes = new Bytes(this.sourceAddress.toBytes());
    return pack(
      [this.codecId, this.typeId, sourceAddressBytes, this.payload],
      codec,
    );
  }
}
