import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax';
import type { Codec } from '../codec';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Id } from '../fxs/common';
import { BigIntPr } from '../primitives';
import { PVMTx } from './abstractTx';

@serializable()
export class IncreaseBalanceTx extends PVMTx {
  _type = TypeSymbols.IncreaseBalanceTx;

  constructor(
    public readonly baseTx: BaseTx,
    /**
     * The corresponding Validator ID.
     */
    public readonly validationId: Id,
    /**
     * Balance <= sum of AVAX inputs - sum of AVAX outputs - Tx fee
     */
    public readonly balance: BigIntPr,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [increaseBalanceTx: IncreaseBalanceTx, rest: Uint8Array] {
    const [baseTx, validationId, balance, rest] = unpack(
      bytes,
      [BaseTx, Id, BigIntPr],
      codec,
    );

    return [new IncreaseBalanceTx(baseTx, validationId, balance), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.baseTx, this.validationId, this.balance], codec);
  }
}
