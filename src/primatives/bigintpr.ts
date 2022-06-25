import { serializable } from '../common/types';
import { bufferToBigInt, hexToBuffer, padLeft } from '../utils/buffer';

// typescript doesn't like BigInt as a class name
@serializable()
export class BigIntPr {
  id = 'primatives.BigInt';
  constructor(private bigint: bigint) {}

  static fromBytes(buf: Uint8Array): [BigIntPr, Uint8Array] {
    return [new BigIntPr(bufferToBigInt(buf.slice(0, 8))), buf.slice(8)];
  }

  toBytes() {
    return padLeft(hexToBuffer(this.bigint.toString(16)), 8);
  }

  value(): bigint {
    return this.bigint;
  }
}
