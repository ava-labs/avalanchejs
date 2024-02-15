import { customInspectSymbol } from '../../constants/node';
import { bufferToBigInt, hexToBuffer, padLeft } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

// typescript doesn't like BigInt as a class name
@serializable()
export class BigIntPr extends Primitives {
  _type = TypeSymbols.BigIntPr;
  constructor(private readonly bigint: bigint) {
    super();
  }

  [customInspectSymbol]() {
    return this.bigint;
  }

  static fromBytes(buf: Uint8Array): [BigIntPr, Uint8Array] {
    return [new BigIntPr(bufferToBigInt(buf.slice(0, 8))), buf.slice(8)];
  }

  toJSON() {
    return this.bigint.toString();
  }

  toBytes() {
    return padLeft(hexToBuffer(this.bigint.toString(16)), 8);
  }

  value(): bigint {
    return this.bigint;
  }
}
