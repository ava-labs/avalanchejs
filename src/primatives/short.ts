import { serializable } from '../common/types';
import { bufferToNumber, hexToBuffer, padLeft } from '../utils/buffer';

const _symbol = Symbol('primatives.Short');

@serializable()
export class Short {
  _type = _symbol;
  constructor(private short: number) {}

  static fromBytes(buf: Uint8Array): [Short, Uint8Array] {
    return [new Short(bufferToNumber(buf.slice(0, 2))), buf.slice(2)];
  }

  toBytes() {
    return padLeft(hexToBuffer(this.short.toString(16)), 2);
  }

  value() {
    return this.short;
  }
}
