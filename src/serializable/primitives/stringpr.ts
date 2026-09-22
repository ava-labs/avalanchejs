import {
  concatBytes,
  requireBytes,
  toFixedWidthBytes,
} from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { Short, SHORT_LEN } from './short';
import { TypeSymbols } from '../constants';

@serializable()
export class Stringpr extends Primitives {
  _type = TypeSymbols.StringPr;
  constructor(private readonly string: string) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Stringpr, Uint8Array] {
    const [length, remaining] = Short.fromBytes(buf);
    const byteLength = length.value();
    requireBytes(remaining, byteLength, 'Stringpr');

    return [
      new Stringpr(new TextDecoder().decode(remaining.slice(0, byteLength))),
      remaining.slice(byteLength),
    ];
  }

  toJSON() {
    return this.string;
  }

  toBytes() {
    // The length prefix counts UTF-8 bytes, which is not the same as
    // `string.length` (UTF-16 code units) for any non-ASCII character.
    const encoded = new TextEncoder().encode(this.string);

    return concatBytes(
      toFixedWidthBytes(encoded.length, SHORT_LEN, 'Stringpr length'),
      encoded,
    );
  }

  value() {
    return this.string;
  }
}
