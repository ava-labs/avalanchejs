import { serializable } from '../common/types';
import { bytesForInt } from '../fixtures/utils/bytesFor';
import { concatBytes } from '../utils/buffer';
import { Int } from './int';

const _symbol = Symbol('primatives.Bytes');

@serializable()
export class Bytes {
  _type = _symbol;
  constructor(private bytes: Uint8Array) {}

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
