import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { BlsSignature } from '../fxs/common/blsSignature';
import { BigIntPr, Bytes } from '../primitives';
import { PVMTx } from './abstractTx';

@serializable()
export class RegisterSubnetValidatorTx extends PVMTx {
  _type = TypeSymbols.RegisterSubnetValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly balance: BigIntPr,
    public readonly blsSignature: BlsSignature,
    public readonly message: Bytes,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [registerSubnetValidatorTx: RegisterSubnetValidatorTx, rest: Uint8Array] {
    const [baseTx, balance, blsSignature, message, rest] = unpack(
      bytes,
      [BaseTx, BigIntPr, BlsSignature, Bytes],
      codec,
    );
    return [
      new RegisterSubnetValidatorTx(baseTx, balance, blsSignature, message),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return pack(
      [this.baseTx, this.balance, this.blsSignature, this.message],
      codec,
    );
  }
}
