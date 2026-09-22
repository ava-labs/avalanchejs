import { bytesToString } from '@scure/base';
import { bytesForInt } from '../../fixtures/utils/bytesFor';
import { bufferToHex, concatBytes, requireBytes } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Int } from './int';
import { Primitives } from './primatives';
import { TypeSymbols } from '../constants';

@serializable()
export class Bytes extends Primitives {
  _type = TypeSymbols.Bytes;
  constructor(public readonly bytes: Uint8Array) {
    super();
  }

  toString(encoding: 'utf8' | 'hex' = 'utf8') {
    return bytesToString(encoding, this.bytes);
  }

  toJSON() {
    return bufferToHex(this.bytes);
  }

  static fromBytes(buf: Uint8Array): [Bytes, Uint8Array] {
    const [len, remaining] = Int.fromBytes(buf);
    const length = len.value();
    // The length prefix is attacker controlled, so reject a payload that
    // declares more bytes than it carries rather than silently truncating.
    requireBytes(remaining, length, 'Bytes');

    return [new Bytes(remaining.slice(0, length)), remaining.subarray(length)];
  }

  toBytes() {
    return concatBytes(bytesForInt(this.bytes.length), this.bytes);
  }

  /**
   * Returns the length of the bytes (Uint8Array).
   *
   * Useful for calculating tx complexity.
   */
  get length() {
    return this.bytes.length;
  }
}
