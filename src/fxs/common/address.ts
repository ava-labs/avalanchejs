import { serializable } from '../../common/types';
import { bufferToHex, hexToBuffer, padLeft } from '../../utils/buffer';

@serializable()
export class Address {
  id = 'common.Address';
  constructor(private address: string) {}

  static fromBytes(buf: Uint8Array): [Address, Uint8Array] {
    return [new Address(bufferToHex(buf.slice(0, 20))), buf.slice(20)];
  }

  toBytes(): Uint8Array {
    return padLeft(hexToBuffer(this.address), 20);
  }
}
