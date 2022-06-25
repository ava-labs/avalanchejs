import { serializable } from '../common/types';

const _symbol = Symbol('primitives.Byte');

@serializable()
export class Byte {
  _type = _symbol;
  constructor(private byte: Uint8Array) {}

  static fromBytes(buf: Uint8Array): [Byte, Uint8Array] {
    return [new Byte(buf.slice(0, 1)), buf.slice(1)];
  }

  toBytes() {
    return this.byte;
  }
}
