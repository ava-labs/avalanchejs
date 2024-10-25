import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { BigIntPr, Bytes } from '../primitives';
import { PVMTx } from './abstractTx';
import { RegisterSubnetValidator } from './registerSubnetValidator';

@serializable()
export class RegisterSubnetValidatorTx extends PVMTx {
  _type = TypeSymbols.RegisterSubnetValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly balance: BigIntPr,
    public readonly blsSignature: Bytes,
    public readonly message: RegisterSubnetValidator,
  ) {
    super();
  }

  static fromNative(
    baseTx: BaseTx,
    balance: bigint,
    blsSignature: Uint8Array,
    message: RegisterSubnetValidator,
  ): RegisterSubnetValidatorTx {
    return new RegisterSubnetValidatorTx(
      baseTx,
      new BigIntPr(balance),
      new Bytes(blsSignature),
      message,
    );
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [RegisterSubnetValidatorTx, Uint8Array] {
    const [baseTx, balance, blsSignature, message, rest] = unpack(
      bytes,
      [BaseTx, BigIntPr, Bytes, RegisterSubnetValidator],
      codec,
    );
    return [
      new RegisterSubnetValidatorTx(baseTx, balance, blsSignature, message),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.balance, this.blsSignature, this.message], codec),
    );
  }
}
