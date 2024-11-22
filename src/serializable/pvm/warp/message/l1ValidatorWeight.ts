import { pack, unpack } from '../../../../utils/struct';
import type { Codec } from '../../../codec';
import { serializable } from '../../../common/types';
import { TypeSymbols } from '../../../constants';
import { Id } from '../../../fxs/common';
import { BigIntPr } from '../../../primitives';

@serializable()
export class L1ValidatorWeight {
  _type = TypeSymbols.WarpL1ValidatorWeight;

  constructor(
    public readonly validationId: Id,
    public readonly nonce: BigIntPr,
    public readonly weight: BigIntPr,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [L1ValidatorWeight, Uint8Array] {
    const [validationId, nonce, weight, rest] = unpack(
      bytes,
      [Id, BigIntPr, BigIntPr],
      codec,
    );

    return [new L1ValidatorWeight(validationId, nonce, weight), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.validationId, this.nonce, this.weight], codec);
  }
}
