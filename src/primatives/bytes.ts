import { serializable } from '../common/types';
import { concatBytes } from '../utils/buffer';
import { Int } from './int';

@serializable()
export class Bytes {
  id = 'primatives.id';
  constructor(private bytes: Uint8Array) {}

  static fromBytes(buf: Uint8Array): [Bytes, Uint8Array] {
    const [len, remaining] = Int.fromBytes(buf);

    return [
      new Bytes(remaining.slice(0, len.value())),
      remaining.slice(len.value()),
    ];
  }

  toBytes() {
    return concatBytes(new Int(this.bytes.length).toBytes(), this.bytes);
  }
}
