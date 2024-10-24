import { concatBytes } from '../../utils/buffer';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { BigIntPr, Bytes } from '../primitives';
import { PVMTx } from './abstractTx';
import { ProofOfPossession } from './proofOfPossession';
import { RegisterSubnetValidator } from './registerSubnetValidator';

@serializable()
export class RegisterSubnetValidatorTx extends PVMTx {
  _type = TypeSymbols.RegisterSubnetValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly balance: BigIntPr,
    public readonly proofOfPossession: ProofOfPossession,
    public readonly message: RegisterSubnetValidator,
  ) {
    super();
  }

  static fromNative(
    baseTx: BaseTx,
    balance: bigint,
    proofOfPossession: ProofOfPossession,
    message: RegisterSubnetValidator,
  ): RegisterSubnetValidatorTx {
    return new RegisterSubnetValidatorTx(
      baseTx,
      new BigIntPr(balance),
      proofOfPossession,
      message,
    );
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [RegisterSubnetValidatorTx, Uint8Array] {
    const [baseTx, balance, proofOfPossession, message, rest] = unpack(
      bytes,
      [BaseTx, BigIntPr, ProofOfPossession, Bytes],
      codec,
    );
    return [
      new RegisterSubnetValidatorTx(
        baseTx,
        balance,
        proofOfPossession,
        RegisterSubnetValidator.fromBytes(message.toBytes(), codec)[0],
      ),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack(
        [this.baseTx, this.balance, this.proofOfPossession, this.message],
        codec,
      ),
    );
  }
}
