import { bufferToNumber, hexToBuffer, padLeft } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';

const _symbol = Symbol('primitives.Short');

@serializable()
export class Short extends Primitives {
  _type = _symbol;
  constructor(private readonly short: number) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Short, Uint8Array] {
    return [new Short(bufferToNumber(buf.slice(0, 2))), buf.slice(2)];
  }

  toJSON() {
    return this.short.toString();
  }

  toBytes() {
    return padLeft(hexToBuffer(this.short.toString(16)), 2);
  }

  value() {
    return this.short;
  }
}
