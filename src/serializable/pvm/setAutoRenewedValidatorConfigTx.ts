import { concatBytes } from '@noble/hashes/utils';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import { serializable, type Serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Id } from '../fxs/common';
import { BigIntPr, Int } from '../primitives';
import { PVMTx } from './abstractTx';
import type { Input } from '../fxs/secp256k1';

@serializable()
export class SetAutoRenewedValidatorConfigTx extends PVMTx {
  _type = TypeSymbols.SetAutoRenewedValidatorConfigTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly txId: Id,
    public readonly auth: Serializable,
    public readonly autoCompoundRewardShares: Int,
    public readonly period: BigIntPr,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [SetAutoRenewedValidatorConfigTx, Uint8Array] {
    const [baseTx, txId, auth, autoCompoundRewardShares, period, rest] = unpack(
      bytes,
      [BaseTx, Id, Codec, Int, BigIntPr],
      codec,
    );

    return [
      new SetAutoRenewedValidatorConfigTx(
        baseTx,
        txId,
        auth,
        autoCompoundRewardShares,
        period,
      ),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.txId], codec),
      codec.PackPrefix(this.auth),
      this.autoCompoundRewardShares.toBytes(),
      this.period.toBytes(),
    );
  }

  getAuth() {
    return this.auth as Input;
  }

  getSigIndices(): number[][] {
    return [
      ...this.getInputs().map((input) => {
        return input.sigIndicies();
      }),
      this.getAuth().values(),
    ].filter((indicies): indicies is number[] => indicies !== undefined);
  }
}
