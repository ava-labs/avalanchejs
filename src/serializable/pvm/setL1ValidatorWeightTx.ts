import { pack, unpack } from '../../utils/struct';
import { BaseTx } from '../avax/baseTx';
import type { Codec } from '../codec';
import { serializable } from '../common/types';
import { TypeSymbols } from '../constants';
import { Bytes } from '../primitives';
import { PVMTx } from './abstractTx';

@serializable()
export class SetL1ValidatorWeightTx extends PVMTx {
  _type = TypeSymbols.SetL1ValidatorWeightTx;

  constructor(public readonly baseTx: BaseTx, public readonly message: Bytes) {
    super();
  }

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [SetL1ValidatorWeightTx, Uint8Array] {
    const [baseTx, message, rest] = unpack(bytes, [BaseTx, Bytes], codec);

    return [new SetL1ValidatorWeightTx(baseTx, message), rest];
  }

  toBytes(codec: Codec): Uint8Array {
    return pack([this.baseTx, this.message], codec);
  }
}
