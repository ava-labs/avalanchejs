import { bufferToHex } from '../../utils';
import { serializable } from '../common/types';
import { Primitives } from './primatives';

const _symbol = Symbol('primitives.Byte');

@serializable()
export class Byte extends Primitives {
  _type = _symbol;
  constructor(private readonly byte: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Byte, Uint8Array] {
    return [new Byte(buf.slice(0, 1)), buf.slice(1)];
  }

  toJSON() {
    return bufferToHex(this.byte);
  }

  toBytes() {
    return this.byte;
  }
}
