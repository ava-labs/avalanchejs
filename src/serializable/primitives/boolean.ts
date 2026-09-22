import { requireBytes, toFixedWidthBytes } from '../../utils/buffer';
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
    requireBytes(buf, BOOL_LEN, 'Bool');
    const value = buf[0];

    // Only 0 and 1 are canonical. Treating any other byte as false meant a
    // non-canonical encoding decoded silently and re-serialized to different
    // bytes, invalidating any signature taken over the original.
    if (value > 1) {
      throw new Error(`invalid bool: expected 0 or 1, got ${value}`);
    }

    return [new Bool(value === 1), buf.subarray(BOOL_LEN)];
  }

  toJSON() {
    return this.bool.toString();
  }

  toBytes() {
    return toFixedWidthBytes(this.bool ? 1 : 0, BOOL_LEN, 'Bool');
  }

  value() {
    return this.bool;
  }
}
