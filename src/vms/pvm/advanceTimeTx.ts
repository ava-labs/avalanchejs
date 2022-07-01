import type { Codec } from '../../codec/codec';
import { serializable } from '../../common/types';
import { BigIntPr } from '../../primitives';
import { packSwitched, unpack } from '../../utils/struct';

const _symbol = Symbol('pvm.AdvanceTime');

@serializable()
export class AdvanceTimeTx {
  _type = _symbol;

  constructor(public readonly time: BigIntPr) {}

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
