import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { pack, unpack } from '../../utils/struct';
import { Validator } from './validator';
import { TypeSymbols } from '../constants';

/**
 * @see
 */
@serializable()
export class SubnetValidator {
  _type = TypeSymbols.SubnetValidator;

  constructor(
    public readonly validator: Validator,
    public readonly subnetId: Id,
  ) {}

  static fromNative(
    nodeId: string,
    startTime: bigint,
    endTime: bigint,
    weight: bigint,
    subnetId: Id,
  ) {
    return new SubnetValidator(
      Validator.fromNative(nodeId, startTime, endTime, weight),
      subnetId,
    );
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [SubnetValidator, Uint8Array] {
    const [validator, subnetId, rest] = unpack(bytes, [Validator, Id], codec);
    return [new SubnetValidator(validator, subnetId), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.validator, this.subnetId], codec);
  }
}
