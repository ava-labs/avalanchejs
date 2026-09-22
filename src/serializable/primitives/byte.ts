import { bufferToHex, padLeftStrict, requireBytes } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

/**
 * Number of bytes per byte.
 */
export const BYTE_LEN = 1;

@serializable()
export class Byte extends Primitives {
  _type = TypeSymbols.Byte;
  constructor(private readonly byte: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Byte, Uint8Array] {
    requireBytes(buf, BYTE_LEN, 'Byte');
    return [new Byte(buf.slice(0, BYTE_LEN)), buf.subarray(BYTE_LEN)];
  }

  toJSON() {
    return bufferToHex(this.byte);
  }

  toBytes() {
    return padLeftStrict(this.byte, BYTE_LEN, 'Byte');
  }
}
