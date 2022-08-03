import { Address } from '../serializable/fxs/common';
import { hexToBuffer } from './buffer';

export class AddressMap {
  constructor(initialData: [Address, number][] = []) {
    initialData.forEach(([address, num]) => {
      this.set(address, num);
    });
  }

  storage = new Map<string, number>();

  set(add: Address, item: number) {
    this.storage.set(add.toHex(), item);
    return this;
  }

  get(add: Address): number | undefined {
    return this.storage.get(add.toHex());
  }

  has(add: Address): boolean {
    return this.storage.has(add.toHex());
  }

  size() {
    return this.storage.size;
  }

  forEach(cb: (value: number, key: Address) => void) {
    return this.storage.forEach((val, key) => cb(val, Address.fromHex(key)));
  }

  forEachHex(cb: (value: number, key: string) => void) {
    return this.storage.forEach(cb);
  }
  values() {
    return this.storage.values();
  }
}

export class AddressMaps {
  constructor(addressMaps: AddressMap[] = []) {
    if (addressMaps.length) {
      this.push(...addressMaps);
    }
  }

  private storage: AddressMap[] = [];
  private index: Record<string, [number, number][]> = {};
  push(...addressMaps: AddressMap[]) {
    addressMaps.forEach((addressMap) => {
      addressMap.forEachHex((index, addressHex) => {
        this.index[addressHex] = this.index[addressHex] ?? [];
        this.index[addressHex].push([this.storage.length, index]);
      });
      this.storage.push(addressMap);
    });
  }

  getAddresses(): Uint8Array[] {
    return Object.keys(this.index).map((hex) => hexToBuffer(hex));
  }

  forEach(cb: (coordinates: [number, number][], address: string) => void) {
    Object.entries(this.index).forEach(([address, coordinates]) => {
      cb(coordinates, address);
    });
  }

  has(address: Address): boolean {
    return address.toHex() in this.index;
  }

  toArray() {
    return this.storage;
  }

  merge(newMap: AddressMaps) {
    newMap.toArray().forEach((map) => this.push(map));
  }

  getSigIndicesForAddress(address: Address) {
    return this.index[address.toHex()];
  }
}
