import { packSwitched, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { PVMTx } from './abstractTx';
import { TypeSymbols } from '../constants';

/**
 * @see
 */
@serializable()
export class RewardValidatorTx extends PVMTx {
  _type = TypeSymbols.RewardValidatorTx;

  constructor(public readonly txId: Id) {
    super();
  }

  baseTx = undefined;

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
