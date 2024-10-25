import { concatBytes } from '@noble/hashes/utils';
import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import { Codec } from '../codec/codec';
import { serializable, type Serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Id } from '../fxs/common';
import { PVMTx } from './abstractTx';
import type { Input } from '../fxs/secp256k1';

@serializable()
export class DisableSubnetValidatorTx extends PVMTx {
  _type = TypeSymbols.DisableSubnetValidatorTx;

  constructor(
    public readonly baseTx: BaseTx,
    public readonly validationId: Id,
    public readonly disableAuth: Serializable,
  ) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [disableSubnetValidatorTx: DisableSubnetValidatorTx, rest: Uint8Array] {
    const [baseTx, validationId, disableAuth, rest] = unpack(
      bytes,
      [BaseTx, Id, Codec],
      codec,
    );
    return [
      new DisableSubnetValidatorTx(baseTx, validationId, disableAuth),
      rest,
    ];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      pack([this.baseTx, this.validationId], codec),
      codec.PackPrefix(this.disableAuth),
    );
  }

  getDisableAuth() {
    return this.disableAuth as Input;
  }
}
