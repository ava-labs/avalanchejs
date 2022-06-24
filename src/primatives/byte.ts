import { serializable } from '../common/types';

@serializable()
export class Byte {
  id = 'primatives.byte';
  constructor(private byte: Uint8Array) {}

  static fromBytes(buf: Uint8Array): [Byte, Uint8Array] {
    return [new Byte(buf.slice(0, 1)), buf.slice(1)];
  }

  toBytes() {
    return this.byte;
  }
}
