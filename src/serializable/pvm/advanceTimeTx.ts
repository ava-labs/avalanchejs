import { packSwitched, unpack } from '../../utils/struct';
import type { Codec } from '../codec/codec';
import { serializable } from '../common/types';
import { BigIntPr } from '../primitives';
import { PVMTx } from './abstractTx';
import { TypeSymbols } from '../constants';

@serializable()
export class AdvanceTimeTx extends PVMTx {
  _type = TypeSymbols.AdvanceTimeTx;

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
