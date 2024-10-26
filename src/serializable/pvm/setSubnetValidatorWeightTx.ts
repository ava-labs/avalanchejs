import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import type { Codec } from '../codec';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Bytes } from '../primitives';
import { PVMTx } from './abstractTx';

@serializable()
export class SetSubnetValidatorWeightTx extends PVMTx {
  _type = TypeSymbols.SetSubnetValidatorWeightTx;

  constructor(public readonly baseTx: BaseTx, public readonly message: Bytes) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [SetSubnetValidatorWeightTx, Uint8Array] {
    const [baseTx, message, rest] = unpack(bytes, [BaseTx, Bytes], codec);

    return [new SetSubnetValidatorWeightTx(baseTx, message), rest];
  }

  toBytes(codec: Codec): Uint8Array {
    return pack([this.baseTx, this.message], codec);
  }
}
