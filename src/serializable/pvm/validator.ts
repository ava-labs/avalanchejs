import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { BigIntPr } from '../primitives';
import { pack, unpack } from '../../utils/struct';

const _symbol = Symbol('pvm.Validator');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#unsigned-add-validator-tx
 */
@serializable()
export class Validator {
  _type = _symbol;

  constructor(
    public readonly nodeId: Id,
    public readonly startTime: BigIntPr,
    public readonly endTime: BigIntPr,
    public readonly weight: BigIntPr,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [Validator, Uint8Array] {
    const [nodeId, startTime, endTime, weight, rest] = unpack(
      bytes,
      [Id, BigIntPr, BigIntPr, BigIntPr],
      codec,
    );
    return [new Validator(nodeId, startTime, endTime, weight), rest];
  }

  toBytes(codec: Codec) {
    return pack(
      [this.nodeId, this.startTime, this.endTime, this.weight],
      codec,
    );
  }
}
