import {
  bufferToNumber,
  requireBytes,
  toFixedWidthBytes,
} from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

/**
 * Number of bytes per short.
 */
export const SHORT_LEN = 2;

@serializable()
export class Short extends Primitives {
  _type = TypeSymbols.Short;
  constructor(private readonly short: number) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Short, Uint8Array] {
    requireBytes(buf, SHORT_LEN, 'Short');
    return [
      new Short(bufferToNumber(buf.slice(0, SHORT_LEN))),
      buf.slice(SHORT_LEN),
    ];
  }

  toJSON() {
    return this.short.toString();
  }

  toBytes() {
    return toFixedWidthBytes(this.short, SHORT_LEN, 'Short');
  }

  value() {
    return this.short;
  }
}
