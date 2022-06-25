import { serializable } from '../common/types';
import { packList, unpackList } from '../utils/serializeList';
import { Int } from './int';

const _symbol = Symbol('primatives.Ints');

@serializable()
export class Ints {
  _type = _symbol;
  constructor(private ints: Int[]) {}

  static fromBytes(buf: Uint8Array): [Ints, Uint8Array] {
    const [ints, remaining] = unpackList(buf, Int);
    return [new Ints(ints), remaining];
  }

  toBytes() {
    return packList(this.ints);
  }
}
