import type { Codec } from '../codec';
import { serializable } from '../common/types';
import { bufferToNumber, hexToBuffer, padLeft } from '../utils/buffer';

const _symbol = Symbol('primatives.Int');

@serializable()
export class Int {
  _type = _symbol;
  constructor(private int: number) {}

  static fromBytes(buf: Uint8Array): [Int, Uint8Array] {
    return [new Int(bufferToNumber(buf.slice(0, 4))), buf.slice(4)];
  }

  toBytes(_codec: Codec) {
    return this.toBytesNoCodec();
  }

  // used when we just need quick bytes for a number
  toBytesNoCodec() {
    return padLeft(hexToBuffer(this.int.toString(16)), 4);
  }

  value() {
    return this.int;
  }
}
