import { serializable } from '../../common/types';
import { packList, unpackList } from '../../utils/serializeList';
import { Address } from './address';

const _symbol = Symbol('common.Addresses');

@serializable()
export class Addresses {
  _type = _symbol;
  constructor(private addresses: Address[]) {}

  static fromBytes(buf: Uint8Array): [Addresses, Uint8Array] {
    const [addresses, remaining] = unpackList(buf, Address);
    return [new Addresses(addresses), remaining];
  }

  toBytes() {
    return packList(this.addresses);
  }
}
