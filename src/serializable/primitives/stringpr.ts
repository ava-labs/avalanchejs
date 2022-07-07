import { serializable } from '../common/types';
import { concatBytes, hexToBuffer, padLeft } from '../../utils/buffer';
import { Short } from './short';

const _symbol = Symbol('primitives.String');

@serializable()
export class Stringpr {
  _type = _symbol;
  constructor(private readonly string: string) {}

  static fromBytes(buf: Uint8Array): [Stringpr, Uint8Array] {
    const [length, remaining] = Short.fromBytes(buf);
    return [
      new Stringpr(
        new TextDecoder().decode(remaining.slice(0, length.value())),
      ),
      remaining.slice(length.value()),
    ];
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
