import { bytesForInt } from '../../fixtures/utils/bytesFor';
import { bufferToHex, concatBytes } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Int } from './int';
import { Primitives } from './primatives';

const _symbol = Symbol('primitives.Bytes');

@serializable()
export class Bytes extends Primitives {
  _type = _symbol;
  constructor(private readonly bytes: Uint8Array) {
    super();
  }

  toJSON() {
    return bufferToHex(this.bytes);
  }

  static fromBytes(buf: Uint8Array): [Bytes, Uint8Array] {
    const [len, remaining] = Int.fromBytes(buf);

    return [
      new Bytes(remaining.slice(0, len.value())),
      remaining.slice(len.value()),
    ];
  }

  toBytes() {
    return concatBytes(bytesForInt(this.bytes.length), this.bytes);
  }
}
