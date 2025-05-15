import { pack, unpack } from '../../../../../utils/struct';
import type { Codec } from '../../../../codec';
import { serializable } from '../../../../common/types';
import { TypeSymbols } from '../../../../constants';
import { Id } from '../../../../fxs/common';
import { Int, Short } from '../../../../primitives';

/**
 * The P-Chain can produce a SubnetToL1ConversionMessage for consumers
 * (i.e. validator managers) to be aware of the initial validator set.
 *
 * Ref: https://github.com/avalanche-foundation/ACPs/blob/58c78c/ACPs/77-reinventing-subnets/README.md#subnettol1conversionmessage
 */
@serializable()
export class SubnetToL1ConversionMessage {
  _type = TypeSymbols.SubnetToL1ConversionMessage;
  public readonly codecId = new Short(0);
  public readonly typeId = new Int(0);

  constructor(public readonly conversionId: Id) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [SubnetToL1ConversionMessage, Uint8Array] {
    const [typeId, remaining] = unpack(bytes, [Int], codec);
    if (typeId.value() !== 0) {
      throw new Error(
        `Invalid type id for SubnetToL1ConversionMessage. Required typeId: 0. Got typeId: ${typeId.value()}`,
      );
    }

    const [conversionId, rest] = unpack(remaining, [Id], codec);

    return [new SubnetToL1ConversionMessage(conversionId), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.typeId, this.conversionId], codec);
  }

  getConversionId() {
    return this.conversionId.value();
  }
}
