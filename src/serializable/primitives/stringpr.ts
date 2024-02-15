import { concatBytes, hexToBuffer, padLeft } from '../../utils/buffer';
import { serializable } from '../common/types';
import { Primitives } from './primatives';
import { Short } from './short';
import { TypeSymbols } from '../constants';

@serializable()
export class Stringpr extends Primitives {
  _type = TypeSymbols.StringPr;
  constructor(private readonly string: string) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Stringpr, Uint8Array] {
    const [length, remaining] = Short.fromBytes(buf);
    return [
      new Stringpr(
        new TextDecoder().decode(remaining.slice(0, length.value())),
      ),
      remaining.slice(length.value()),
    ];
  }

  toJSON() {
    return this.string;
  }

  toBytes() {
    return concatBytes(
      padLeft(hexToBuffer(this.string.length.toString(16)), 2),
      new TextEncoder().encode(this.string),
    );
  }

  value() {
    return this.string;
  }
}
