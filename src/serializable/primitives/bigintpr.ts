import { customInspectSymbol } from '../../constants/node';
import {
  bufferToBigInt,
  requireBytes,
  toFixedWidthBytes,
} from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

/**
 * Number of bytes per bigint.
 */
export const BIGINT_LEN = 8;

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
    requireBytes(buf, BIGINT_LEN, 'BigIntPr');
    return [
      new BigIntPr(bufferToBigInt(buf.slice(0, BIGINT_LEN))),
      buf.slice(BIGINT_LEN),
    ];
  }

  toJSON() {
    return this.bigint.toString();
  }

  toBytes() {
    return toFixedWidthBytes(this.bigint, BIGINT_LEN, 'BigIntPr');
  }

  value(): bigint {
    return this.bigint;
  }
}
