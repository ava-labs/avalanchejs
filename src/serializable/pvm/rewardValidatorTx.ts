import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { packSwitched, unpack } from '../../utils/struct';

const _symbol = Symbol('pvm.RewardValidatorTx');

/**
 * @see
 */
@serializable()
export class RewardValidatorTx {
  _type = _symbol;

  constructor(public readonly txId: Id) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [RewardValidatorTx, Uint8Array] {
    const [txId, rest] = unpack(bytes, [Id], codec);
    return [new RewardValidatorTx(txId), rest];
  }

  toBytes(codec: Codec) {
    return packSwitched(codec, this.txId);
  }
}
