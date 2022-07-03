import { serializable } from '../../common/types';
import { bufferToHex, hexToBuffer, padLeft } from '../../utils/buffer';

const _symbol = Symbol('common.Address');

@serializable()
export class Address {
  _type = _symbol;
  constructor(private readonly address: string) {}

  static fromBytes(buf: Uint8Array): [Address, Uint8Array] {
    return [new Address(bufferToHex(buf.slice(0, 20))), buf.slice(20)];
  }

  toBytes() {
    return padLeft(hexToBuffer(this.address), 20);
  }
  value() {
    return this.address;
  }
}
