import { bufferToBool, hexToBuffer, padLeft } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

/**
 * Number of bytes per bool.
 */
export const BOOL_LEN = 1;

@serializable()
export class Bool extends Primitives {
  _type = TypeSymbols.Bool;
  constructor(private readonly bool: boolean) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Bool, Uint8Array] {
    return [
      new Bool(bufferToBool(buf.slice(0, BOOL_LEN))),
      buf.slice(BOOL_LEN),
    ];
  }

  toJSON() {
    return this.bool.toString();
  }

  toBytes() {
    return padLeft(hexToBuffer(this.bool ? '1' : '0'), BOOL_LEN);
  }

  value() {
    return this.bool;
  }
}
