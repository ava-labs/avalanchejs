import { pack, unpack } from '../../../../utils/struct';
import type { Codec } from '../../../codec';
import { serializable } from '../../../common/types';
import { TypeSymbols } from '../../../constants';
import { Id } from '../../../fxs/common';
import { BigIntPr, Int, Short } from '../../../primitives';

@serializable()
export class L1ValidatorWeightPayload {
  _type = TypeSymbols.L1ValidatorWeightPayload;
  public readonly codecId = new Short(0);
  public readonly typeId = new Int(3);

  constructor(
    public readonly validationId: Id,
    public readonly nonce: BigIntPr,
    public readonly weight: BigIntPr,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [L1ValidatorWeightPayload, Uint8Array] {
    const [typeId, remaining] = unpack(bytes, [Int], codec);
    if (typeId.value() !== 3) {
      throw new Error(
        `Invalid type id for L1ValidatorWeightPayload. Required typeId: 3. Got typeId: ${typeId.value()}`,
      );
    }

    const [validationId, nonce, weight, rest] = unpack(
      remaining,
      [Id, BigIntPr, BigIntPr],
      codec,
    );

    return [new L1ValidatorWeightPayload(validationId, nonce, weight), rest];
  }

  toBytes(codec: Codec) {
    return pack(
      [this.codecId, this.typeId, this.validationId, this.nonce, this.weight],
      codec,
    );
  }
}
