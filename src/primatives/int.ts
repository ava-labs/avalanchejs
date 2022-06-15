import { serializable } from '../common/types';
import { bufferToNumber, hexToBuffer, padLeft } from '../utils/buffer';

@serializable()
export class Int {
  id = 'primatives.int';
  constructor(private int: number) {}

  static fromBytes(buf: Uint8Array): [Int, Uint8Array] {
    return [new Int(bufferToNumber(buf.slice(0, 4))), buf.slice(4)];
  }

  toBytes() {
    return padLeft(hexToBuffer(this.int.toString(16)), 4);
  }

  value() {
    return this.int;
  }
}
