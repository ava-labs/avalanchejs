import { pack, unpack } from '../../../../utils/struct';
import type { Codec } from '../../../codec';
import { serializable } from '../../../common/types';
import { TypeSymbols } from '../../../constants';
import { Address } from '../../../fxs/common';
import { Bytes, Int, Short } from '../../../primitives';

/**
 * AddressedCall is one of payload structures, used by AvalancheGo to send
 * warp messages. It can have a sourceAddress and an internal message payload
 * that can have its specific structure.
 *
 * Ref: https://github.com/ava-labs/avalanchego/blob/6e04bc0/vms/platformvm/warp/payload/README.md#addressedcall
 */
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
    return pack([this.typeId, sourceAddressBytes, this.payload], codec);
  }

  getSourceAddress(encoding: 'bech32' | 'hex' = 'hex', hrp = 'avax') {
    if (encoding === 'bech32') {
      return this.sourceAddress.toString(hrp);
    }
    return this.sourceAddress.toHex();
  }

  getPayload() {
    return this.payload.toString('hex');
  }
}
