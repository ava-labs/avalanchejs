import { customInspectSymbol } from '../../constants/node';
import { bufferToNumber, hexToBuffer, padLeft } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

/**
 * Number of bytes per int.
 */
export const INT_LEN = 4;

@serializable()
export class Int extends Primitives {
  _type = TypeSymbols.Int;
  constructor(private readonly int: number) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Int, Uint8Array] {
    return [new Int(bufferToNumber(buf.slice(0, INT_LEN))), buf.slice(INT_LEN)];
  }

  [customInspectSymbol]() {
    return this.value();
  }

  toJSON() {
    return this.int;
  }

  toBytes() {
    return padLeft(hexToBuffer(this.int.toString(16)), INT_LEN);
  }

  value() {
    return this.int;
  }
}
