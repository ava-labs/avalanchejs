import { customInspectSymbol } from '../../constants/node';
import { bufferToNumber, hexToBuffer, padLeft } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

@serializable()
export class Int extends Primitives {
  _type = TypeSymbols.Int;
  constructor(private readonly int: number) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Int, Uint8Array] {
    return [new Int(bufferToNumber(buf.slice(0, 4))), buf.slice(4)];
  }

  [customInspectSymbol]() {
    return this.value();
  }

  toJSON() {
    return this.int;
  }

  toBytes() {
    return padLeft(hexToBuffer(this.int.toString(16)), 4);
  }

  value() {
    return this.int;
  }
}
