import { serializable } from '../common/types';
import { packList, unpackList } from '../utils/serializeList';
import { Int } from './int';

@serializable()
export class Ints {
  id = 'primatives.Ints';
  constructor(private ints: Int[]) {}

  static fromBytes(buf: Uint8Array): [Ints, Uint8Array] {
    const [ints, remaining] = unpackList(buf, Int);
    return [new Ints(ints), remaining];
  }

  toBytes() {
    return packList(this.ints);
  }
}
