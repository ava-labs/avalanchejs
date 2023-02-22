import { packSwitched, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';
import { PVMTx } from './abstractTx';

export const advanceTimeTx_symbol = Symbol('pvm.AdvanceTimeTx');

@serializable()
export class AdvanceTimeTx extends PVMTx {
  _type = advanceTimeTx_symbol;

  constructor(public readonly time: BigIntPr) {
    super();
  }
  baseTx = undefined;

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [AdvanceTimeTx, Uint8Array] {
    const [time, rest] = unpack(bytes, [BigIntPr], codec);
    return [new AdvanceTimeTx(time), rest];
  }

  toBytes(codec: Codec) {
    return packSwitched(codec, this.time);
  }
}
