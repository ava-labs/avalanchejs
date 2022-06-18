import { serializable } from '../../common/types';
import { packList, unpackList } from '../../utils/serializeList';
import { Address } from './address';

@serializable()
export class Addresses {
  id = 'common.Addresses';
  constructor(private addresses: Address[]) {}

  static fromBytes(buf: Uint8Array): [Addresses, Uint8Array] {
    const [addresses, remaining] = unpackList(buf, Address);
    return [new Addresses(addresses), remaining];
  }

  toBytes(): Uint8Array {
    return packList(this.addresses);
  }
}
