import { pack, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { Id } from '../fxs/common';
import { BigIntPr } from '../primitives';
import { PVMTx } from './abstractTx';
import { TypeSymbols } from '../constants';

@serializable()
export class RewardAutoRenewedValidatorTx extends PVMTx {
  _type = TypeSymbols.RewardAutoRenewedValidatorTx;

  constructor(public readonly txId: Id, public readonly timestamp: BigIntPr) {
    super();
  }

  baseTx = undefined;

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [RewardAutoRenewedValidatorTx, Uint8Array] {
    const [txId, timestamp, rest] = unpack(bytes, [Id, BigIntPr], codec);
    return [new RewardAutoRenewedValidatorTx(txId, timestamp), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.txId, this.timestamp], codec);
  }
}
